import dotenv from 'dotenv';
dotenv.config();

import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { env } from './src/config/env.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Find a user
  const { data: users } = await supabase.from('users').select('id, name, email');
  if (!users || users.length === 0) {
    console.error('No users found in database');
    return;
  }
  const testUser = users[0];
  console.log('Testing with user:', testUser.name, '(', testUser.id, ')');

  // Sign JWT
  const token = jwt.sign({ id: testUser.id }, env.jwtSecret);
  
  // Call GET /orders with parameters
  const chatId = 'ffb6187a-f671-4ee9-8cd0-792857b85ad5';
  const contactId = '143c5b99-32ac-422e-9636-1edc93c5e8b8';
  
  const urlWithParams = `http://localhost:5000/orders?chat_id=${chatId}&contact_id=${contactId}`;
  const urlWithoutParams = `http://localhost:5000/orders`;

  console.log('Fetching with params:', urlWithParams);
  try {
    const res = await fetch(urlWithParams, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    console.log('Status with params:', res.status);
    const data = await res.json();
    console.log('Data with params count:', data.data?.length || data.length);
    console.log('Data with params items:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error with params:', err);
  }

  console.log('Fetching without params:', urlWithoutParams);
  try {
    const res = await fetch(urlWithoutParams, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    console.log('Status without params:', res.status);
    const data = await res.json();
    console.log('Data without params count:', data.data?.length || data.length);
  } catch (err) {
    console.error('Error without params:', err);
  }
}
run();
