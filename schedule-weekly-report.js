// schedule-weekly-report.js
// Schedules the weekly report generation every Monday at 09:00 AM
const cron = require('node-cron');
const { exec } = require('child_process');

cron.schedule('0 9 * * 1', () => {
  exec('node generate-weekly-report.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating weekly report: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
  });
});

console.log(
  'Weekly report scheduler started. Will run every Monday at 09:00 AM.',
);
