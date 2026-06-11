import express from 'express';

const router = express.Router();

router.post('/', (req, res) => {
  console.log('[meta-test] received webhook:');
  console.log(JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

export default router;
