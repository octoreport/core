import { AppError } from '../src/errors';
const err = new AppError('테스트 에러', { meta: { status: 404 } });
console.log('STRING', err.toString()); // AppError: 테스트 에러
console.log('JSON', err.toJSON()); // JSON 형태 출력
