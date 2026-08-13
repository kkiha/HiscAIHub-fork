-- 기존 카테고리가 새 6종 체계로 어떻게 이동하는지 마이그레이션 로그에 남긴다.
DO $$
DECLARE
  mapping RECORD;
BEGIN
  FOR mapping IN
    SELECT
      'Prompt'::TEXT AS content_type,
      "category" AS source_category,
      CASE "category"
        WHEN '리서치' THEN '조사·리서치'
        WHEN '고객응대' THEN '작성·요약'
        WHEN '업무보고' THEN '작성·요약'
        WHEN '기획' THEN '기획·아이디어'
        WHEN '코딩' THEN '자동화·개발'
        WHEN '번역/작성' THEN '번역·검토'
        WHEN '컴플라이언스' THEN '번역·검토'
        ELSE '작성·요약'
      END AS target_category,
      COUNT(*) AS row_count
    FROM "Prompt"
    WHERE "category" NOT IN ('작성·요약', '조사·리서치', '분석', '번역·검토', '기획·아이디어', '자동화·개발')
    GROUP BY "category"

    UNION ALL

    SELECT
      'Agent'::TEXT AS content_type,
      "category" AS source_category,
      CASE "category"
        WHEN '리서치' THEN '조사·리서치'
        WHEN '고객응대' THEN '작성·요약'
        WHEN '업무보고' THEN '작성·요약'
        WHEN '기획' THEN '기획·아이디어'
        WHEN '코딩' THEN '자동화·개발'
        WHEN '번역/작성' THEN '번역·검토'
        WHEN '컴플라이언스' THEN '번역·검토'
        ELSE '작성·요약'
      END AS target_category,
      COUNT(*) AS row_count
    FROM "Agent"
    WHERE "category" NOT IN ('작성·요약', '조사·리서치', '분석', '번역·검토', '기획·아이디어', '자동화·개발')
    GROUP BY "category"
  LOOP
    RAISE NOTICE 'Category mapping [%]: "%" -> "%" (% rows)',
      mapping.content_type,
      mapping.source_category,
      mapping.target_category,
      mapping.row_count;
  END LOOP;
END $$;

UPDATE "Prompt"
SET "category" = CASE "category"
  WHEN '리서치' THEN '조사·리서치'
  WHEN '고객응대' THEN '작성·요약'
  WHEN '업무보고' THEN '작성·요약'
  WHEN '기획' THEN '기획·아이디어'
  WHEN '코딩' THEN '자동화·개발'
  WHEN '번역/작성' THEN '번역·검토'
  WHEN '컴플라이언스' THEN '번역·검토'
  ELSE '작성·요약'
END
WHERE "category" NOT IN ('작성·요약', '조사·리서치', '분석', '번역·검토', '기획·아이디어', '자동화·개발');

UPDATE "Agent"
SET "category" = CASE "category"
  WHEN '리서치' THEN '조사·리서치'
  WHEN '고객응대' THEN '작성·요약'
  WHEN '업무보고' THEN '작성·요약'
  WHEN '기획' THEN '기획·아이디어'
  WHEN '코딩' THEN '자동화·개발'
  WHEN '번역/작성' THEN '번역·검토'
  WHEN '컴플라이언스' THEN '번역·검토'
  ELSE '작성·요약'
END
WHERE "category" NOT IN ('작성·요약', '조사·리서치', '분석', '번역·검토', '기획·아이디어', '자동화·개발');

-- Category 모델도 동일한 6종과 순서만 남긴다. Prompt/Agent.category는 문자열이라 FK 영향은 없다.
DELETE FROM "Category"
WHERE "name" NOT IN ('작성·요약', '조사·리서치', '분석', '번역·검토', '기획·아이디어', '자동화·개발');

INSERT INTO "Category" ("id", "name", "order") VALUES
  ('work-category-writing-summary', '작성·요약', 1),
  ('work-category-research', '조사·리서치', 2),
  ('work-category-analysis', '분석', 3),
  ('work-category-translation-review', '번역·검토', 4),
  ('work-category-planning-ideas', '기획·아이디어', 5),
  ('work-category-automation-development', '자동화·개발', 6)
ON CONFLICT ("name") DO UPDATE SET "order" = EXCLUDED."order";
