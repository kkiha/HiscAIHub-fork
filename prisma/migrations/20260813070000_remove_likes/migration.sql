-- 좋아요 알림은 enum 값을 제거하기 전에 삭제한다.
DELETE FROM "Notification" WHERE "type" = 'like';

-- PostgreSQL enum에서는 값을 직접 제거할 수 없어 comment 값만 가진 enum으로 교체한다.
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
CREATE TYPE "NotificationType" AS ENUM ('comment');
ALTER TABLE "Notification"
  ALTER COLUMN "type" TYPE "NotificationType"
  USING ("type"::text::"NotificationType");
DROP TYPE "NotificationType_old";

-- 좋아요 관계와 집계 캐시를 제거한다.
DROP TABLE "Like";
ALTER TABLE "Prompt" DROP COLUMN "likeCount";
ALTER TABLE "Agent" DROP COLUMN "likeCount";
