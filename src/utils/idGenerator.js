import { getAll } from '../database/db.js';

const PREFIX = {
  CASE: 'GT',
  REPORT: 'RP',
  TASK: 'TS'
};

function getCurrentYear() {
  return new Date().getFullYear();
}

function getNextSequence(type) {
  const year = getCurrentYear();
  const key = `${type}_${year}`;

  const result = getAll(
    `SELECT id FROM (
      SELECT id, case_id as code FROM warnings WHERE case_id LIKE ?
      UNION ALL
      SELECT id, report_id as code FROM reports WHERE report_id LIKE ?
      UNION ALL
      SELECT id, task_id as code FROM tasks WHERE task_id LIKE ?
    ) ORDER BY code DESC LIMIT 1`,
    [`${PREFIX.CASE}-${year}-%`, `${PREFIX.REPORT}-${year}-%`, `${PREFIX.TASK}-${year}-%`]
  );

  if (result.length === 0) {
    return 1;
  }

  const lastCode = result[0].code;
  const parts = lastCode.split('-');
  const lastSeq = parseInt(parts[parts.length - 1], 10);
  return lastSeq + 1;
}

function padNumber(num) {
  return num.toString().padStart(4, '0');
}

export function generateCaseId() {
  const year = getCurrentYear();
  const seq = getNextSequence('CASE');
  return `${PREFIX.CASE}-${year}-${padNumber(seq)}`;
}

export function generateReportId() {
  const year = getCurrentYear();
  const seq = getNextSequence('REPORT');
  return `${PREFIX.REPORT}-${year}-${padNumber(seq)}`;
}

export function generateTaskId() {
  const year = getCurrentYear();
  const seq = getNextSequence('TASK');
  return `${PREFIX.TASK}-${year}-${padNumber(seq)}`;
}

export default { generateCaseId, generateReportId, generateTaskId };