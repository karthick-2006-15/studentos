import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting NEXUS API automated integration tests...\n');

  try {
    // 1. Health check
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✓ Health check passed:', health.data.status);

    // 2. Authentication Login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'karthick@nexus.io',
      password: 'Password123!'
    });
    console.log('✓ Auth login passed for user:', loginRes.data.user.email);
    const token = loginRes.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 3. User Me Profile
    const meRes = await axios.get(`${BASE_URL}/auth/me`, { headers: authHeaders });
    console.log('✓ User profile retrieved:', meRes.data.user.name, `(${meRes.data.user.major})`);

    // 4. Tasks & Priorities
    const tasksRes = await axios.get(`${BASE_URL}/tasks?status=todo`, { headers: authHeaders });
    console.log(`✓ Tasks endpoint returned ${tasksRes.data.tasks.length} active tasks.`);
    if (tasksRes.data.tasks.length > 0) {
      const topTask = tasksRes.data.tasks[0];
      console.log(`  Top Priority Task: "${topTask.title}" (Score: ${topTask.calculatedScore})`);
    }

    // 5. Courses & Academics
    const coursesRes = await axios.get(`${BASE_URL}/courses`, { headers: authHeaders });
    console.log(`✓ Courses endpoint returned ${coursesRes.data.courses.length} college courses.`);
    for (const c of coursesRes.data.courses) {
      console.log(`  Course: [${c.code}] ${c.name} (${c.units?.length || 0} units)`);
    }

    // 6. Calendar Events
    const calRes = await axios.get(`${BASE_URL}/calendar`, { headers: authHeaders });
    console.log(`✓ Calendar returned ${calRes.data.events.length} scheduled events.`);

    // 7. Coding Intelligence (LeetCode & GitHub)
    const codingRes = await axios.get(`${BASE_URL}/coding`, { headers: authHeaders });
    console.log('✓ Coding stats retrieved:');
    console.log(`  LeetCode Solved: ${codingRes.data.leetcode.totalSolved} (Streak: ${codingRes.data.leetcode.streak}d)`);
    console.log(`  GitHub Weekly Commits: ${codingRes.data.github.weeklyCommits}`);

    // 8. Academic Workload Score
    const workloadRes = await axios.get(`${BASE_URL}/analytics/workload`, { headers: authHeaders });
    console.log(`✓ Workload Score: ${workloadRes.data.workload.workloadScore}% (${workloadRes.data.workload.level})`);

    // 9. Daily Briefing
    const briefingRes = await axios.get(`${BASE_URL}/ai/briefing`, { headers: authHeaders });
    console.log(`✓ Daily Briefing generated: "${briefingRes.data.briefing.greeting}" (${briefingRes.data.briefing.priorities.length} priorities today)`);

    console.log('\n🎉 ALL 9 INTEGRATION TESTS PASSED CLEANLY!\n');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
