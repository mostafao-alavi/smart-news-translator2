import dotenv from 'dotenv';
import { testWordPressConnection } from '../src/cron/wpSync';
dotenv.config();

async function runWpIntegrationTest() {
  console.log('--- Starting WordPress REST API Integration Test ---');

  const apiUrl = process.env.WP_API_URL || 'https://updaaate.ir/wp-json/wp/v2/';
  const username = process.env.WP_USERNAME || '1000dastan';
  const appPassword = process.env.WP_APPLICATION_PASSWORD || '';

  console.log(`API URL: ${apiUrl}`);
  console.log(`Username: ${username}`);
  console.log(`Password Configured: ${appPassword ? 'YES (Length: ' + appPassword.length + ')' : 'NO'}`);

  // 1. Test connection
  console.log('\n[Task 2.1] Testing connection via testWordPressConnection...');
  const connResult = await testWordPressConnection(apiUrl, username, appPassword);
  console.log('Connection Test Result:', JSON.stringify(connResult, null, 2));

  // 2. Create Draft Post
  const postsEndpoint = apiUrl.endsWith('/posts') ? apiUrl : `${apiUrl.replace(/\/+$/, '')}/posts`;
  const authHeader = `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`;

  const todayStr = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
  const testTitle = `تست اتصال ۱۰۰۰ دستان — ${todayStr}`;
  const testContent = `<p>این یک پست تستی از سیستم اتوماسیون ۱۰۰۰ دستان است.</p>`;

  console.log(`\n[Task 2.2] Creating draft post on WordPress: "${testTitle}"...`);
  let createdPostId: number | string | null = null;

  try {
    const postRes = await fetch(postsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'User-Agent': 'Hazardastan-IntegrationTest/1.0',
      },
      body: JSON.stringify({
        title: testTitle,
        content: testContent,
        status: 'draft',
      })
    });

    console.log(`HTTP Status: ${postRes.status} ${postRes.statusText}`);
    const postData: any = await postRes.json();

    if (postRes.ok && postData.id) {
      createdPostId = postData.id;
      console.log(`✅ Draft post successfully created! Post ID: ${createdPostId}`);
      console.log(`Post Link: ${postData.link || '(draft)'}`);
      console.log(`Post Status: ${postData.status}`);
    } else {
      console.error('❌ Failed to create draft post. Response:', postData);
    }
  } catch (err: any) {
    console.error('❌ Network error during post creation:', err.message);
  }

  // 3. Delete Draft Post
  if (createdPostId) {
    console.log(`\n[Task 2.4] Deleting test draft post (ID: ${createdPostId})...`);
    try {
      const deleteEndpoint = `${postsEndpoint.replace(/\/+$/, '')}/${createdPostId}?force=true`;
      const delRes = await fetch(deleteEndpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader,
          'User-Agent': 'Hazardastan-IntegrationTest/1.0',
        }
      });

      console.log(`Delete HTTP Status: ${delRes.status} ${delRes.statusText}`);
      if (delRes.ok) {
        const delData: any = await delRes.json();
        console.log(`✅ Test post ${createdPostId} permanently deleted from WordPress:`, delData.deleted ? 'DELETED' : 'STATUS OK');
      } else {
        const delErr = await delRes.text();
        console.error(`❌ Failed to delete test post:`, delErr);
      }
    } catch (delErr: any) {
      console.error(`❌ Network error during post deletion:`, delErr.message);
    }
  }

  console.log('\n--- WordPress Integration Test Complete ---');
}

runWpIntegrationTest().catch(console.error);
