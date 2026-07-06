import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  OUT_OF_SCOPE_REPLY,
  evaluateAIScope,
  shouldShortCircuitAI,
} from '../../../../src/ai/security/scope-guard.js';
import {
  AGENT_MODES,
  resolveAgentMode,
} from '../../../../src/ai/security/agent-mode.js';
import {
  buildAIActionContext,
} from '../../../../src/ai/security/ai-action-context.js';
import {
  AUTHORITY_FIELDS,
  assertNoAuthorityFields,
  assertTenantConsistency,
} from '../../../../src/ai/security/tenant-guard.js';
import { generateAIReply } from '../../../../src/services/ai.service.js';
import { outletsSupabaseRepository } from '../../../../src/db/repositories/index.js';


describe('AISG Phase 1 scope guard', () => {
  it('allows approved SelaluTeh commerce/support domains', () => {
    const result = evaluateAIScope('Mau pesan teh susu dan cek outlet terdekat');
    assert.equal(result.allowed, true);
    assert.equal(result.domain, 'commerce');
  });

  it('routes unrelated coding homework out of scope deterministically', () => {
    const result = evaluateAIScope('Tolong buatkan kode React untuk dashboard crypto');
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'out_of_scope');
    assert.equal(result.reply, OUT_OF_SCOPE_REPLY);
  });

  it('short-circuits out-of-scope requests before retrieval or tools', () => {
    const result = shouldShortCircuitAI({ text: 'Siapa presiden Amerika dan berita politik hari ini?' });
    assert.equal(result.shortCircuit, true);
    assert.equal(result.reply, OUT_OF_SCOPE_REPLY);
    assert.equal(result.callTools, false);
    assert.equal(result.callRetrieval, false);
  });

  it('allows ambiguous customer follow-ups when recent chat context is commerce', () => {
    const result = shouldShortCircuitAI({
      text: 'mana',
      chat: { id: 'chat-1', metadata: { latestOutletRecommendation: { outletId: 'outlet-1' } } },
      history: [
        { senderType: 'ai', text: 'Silakan pilih salah satu outlet untuk lanjut pesan.' },
        { senderType: 'customer', text: 'mana' },
      ],
    });

    assert.equal(result.shortCircuit, false);
    assert.equal(result.reason, 'allowed_by_recent_business_context');
  });

  it('still blocks explicit out-of-scope terms even inside commerce context', () => {
    const result = shouldShortCircuitAI({
      text: 'buatkan kode React',
      chat: { id: 'chat-1', metadata: { latestOutletRecommendation: { outletId: 'outlet-1' } } },
      history: [{ senderType: 'ai', text: 'Silakan pilih salah satu outlet untuk lanjut pesan.' }],
    });

    assert.equal(result.shortCircuit, true);
    assert.equal(result.reason, 'out_of_scope');
  });
});

describe('AISG Phase 1 agent mode and action context', () => {
  it('resolves mode from server config, not model payload', () => {
    const mode = resolveAgentMode({ agent: { mode: AGENT_MODES.SUPPORT }, requestedMode: AGENT_MODES.COMMERCE_CART });
    assert.equal(mode, AGENT_MODES.SUPPORT);
  });

  it('defaults commerce-capable agents to COMMERCE_CART_MODE', () => {
    const mode = resolveAgentMode({ agent: { tools: ['search_products', 'add_cart_item'] } });
    assert.equal(mode, AGENT_MODES.COMMERCE_CART);
  });

  it('builds an immutable trusted context from server state', () => {
    const context = buildAIActionContext({
      workspaceId: 'ws-1',
      channelConnectionId: 'conn-1',
      conversationId: 'chat-1',
      contactId: 'contact-1',
      inboundMessageId: 'msg-1',
      agent: { id: 'agent-1', mode: AGENT_MODES.COMMERCE_CART },
      chat: { currentOutletId: 'outlet-1' },
      cart: { id: 'cart-1', version: 3 },
      channel: 'TELEGRAM',
    });

    assert.equal(Object.isFrozen(context), true);
    assert.equal(context.workspaceId, 'ws-1');
    assert.equal(context.selectedOutletId, 'outlet-1');
    assert.equal(context.activeCartId, 'cart-1');
    assert.equal(context.cartVersion, 3);
    assert.throws(() => {
      context.workspaceId = 'evil';
    }, TypeError);
  });
});

describe('AISG Phase 1 tenant and authority guards', () => {
  it('rejects model-supplied authority fields recursively', () => {
    assert.throws(
      () => assertNoAuthorityFields({ productId: 'p1', nested: { unitPrice: 1 } }),
      /AI_TOOL_AUTHORITY_FIELD_REJECTED/,
    );
  });

  it('declares the authority field denylist', () => {
    assert.ok(AUTHORITY_FIELDS.has('workspaceId'));
    assert.ok(AUTHORITY_FIELDS.has('effectivePrice'));
    assert.ok(AUTHORITY_FIELDS.has('paymentStatus'));
  });

  it('passes tenant consistency for matching server-owned entities', () => {
    assert.doesNotThrow(() => assertTenantConsistency({
      context: { workspaceId: 'ws-1', channelConnectionId: 'conn-1', conversationId: 'chat-1', contactId: 'contact-1', selectedOutletId: 'outlet-1', activeCartId: 'cart-1' },
      entities: {
        connection: { id: 'conn-1', workspaceId: 'ws-1' },
        conversation: { id: 'chat-1', workspaceId: 'ws-1', channelConnectionId: 'conn-1', contactId: 'contact-1' },
        contact: { id: 'contact-1', workspaceId: 'ws-1' },
        outlet: { id: 'outlet-1', workspaceId: 'ws-1' },
        cart: { id: 'cart-1', workspaceId: 'ws-1', outletId: 'outlet-1', contactId: 'contact-1' },
      },
    }));
  });

  it('fails closed without disclosing foreign entity existence on cross-tenant mismatch', () => {
    assert.throws(
      () => assertTenantConsistency({
        context: { workspaceId: 'ws-1', channelConnectionId: 'conn-1', conversationId: 'chat-1' },
        entities: { outlet: { id: 'foreign-outlet', workspaceId: 'ws-2' } },
      }),
      (error) => error.code === 'AI_CONTEXT_TENANT_MISMATCH' && error.publicMessage === 'Data tidak tersedia untuk konteks percakapan ini.',
    );
  });
});

describe('AISG Phase 1 ai.service short-circuit integration', () => {
  it('returns deterministic out-of-scope reply before retrieval or tools', async (t) => {
    const listMock = t.mock.method(outletsSupabaseRepository, 'list', async () => {
      throw new Error('retrieval must not be called');
    });

    const reply = await generateAIReply({
      system: 'Kamu adalah Selkop Bot untuk SelaluTeh.',
      prompt: '',
      message: { id: 'msg-1', text: 'Tolong buatkan kode React untuk dashboard crypto' },
      knowledge: [{ kind: 'qna', question: 'React crypto', answer: 'should-not-return' }],
      agent: { id: 'agent-1', workspaceId: 'ws-1', tools: ['search_products', 'add_cart_item'] },
      chat: { id: 'chat-1', workspaceId: 'ws-1', contactId: 'contact-1' },
      history: [],
    });

    assert.equal(reply, OUT_OF_SCOPE_REPLY);
    assert.equal(listMock.mock.callCount(), 0);
  });

  it('does not generate AI replies during active human takeover', async (t) => {
    const listMock = t.mock.method(outletsSupabaseRepository, 'list', async () => {
      throw new Error('retrieval must not be called');
    });

    const reply = await generateAIReply({
      system: 'Kamu adalah Selkop Bot untuk SelaluTeh.',
      prompt: '',
      message: { id: 'msg-2', text: 'mau pesan teh susu' },
      knowledge: [],
      agent: { id: 'agent-1', workspaceId: 'ws-1', tools: ['search_products', 'add_cart_item'] },
      chat: { id: 'chat-1', workspaceId: 'ws-1', contactId: 'contact-1', takenOverByUserId: 'user-1' },
      history: [],
    });

    assert.equal(reply, '');
    assert.equal(listMock.mock.callCount(), 0);
  });
});
