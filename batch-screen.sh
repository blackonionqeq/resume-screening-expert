#!/bin/bash
# 批量转换 resumes/ 下的 PDF 并打分
# 用法: ./batch-screen.sh [provider] [criteria] [model] [base-url]
#   provider  默认 deepseek（可选: anthropic, openai, deepseek）
#   criteria  默认 criteria/frontend-developer.md
#   model     可选，覆盖 provider 默认模型
#   base-url  可选，覆盖 provider 默认 API 地址

PROVIDER="${1:-deepseek}"
CRITERIA="${2:-criteria/frontend-developer.md}"
MODEL="${3:-}"
BASE_URL="${4:-}"
RESUME_DIR="resumes"
OUTPUT_DIR="results"
MD_DIR="resumes-md"

mkdir -p "$OUTPUT_DIR" "$MD_DIR"

# 统计
total=0
passed=0
failed=0

echo "========================================"
echo " 批量简历筛选"
echo " Provider: $PROVIDER"
echo " Criteria: $CRITERIA"
[ -n "$MODEL" ] && echo " Model: $MODEL"
[ -n "$BASE_URL" ] && echo " Base URL: $BASE_URL"
echo "========================================"
echo ""

for pdf in "$RESUME_DIR"/*.pdf; do
  [ -f "$pdf" ] || continue
  total=$((total + 1))

  filename=$(basename "$pdf" .pdf)
  md_file="$MD_DIR/${filename}.md"
  json_file="$OUTPUT_DIR/${filename}.json"

  echo "----------------------------------------"
  echo "[$total] $filename"
  echo "----------------------------------------"

  # 1. 转换 PDF → MD
  echo "  → 转换 PDF..."
  if pnpm dev convert "$pdf" -o "$md_file" 2>&1 | tail -1; then
    echo "  ✓ 已保存: $md_file"
  else
    echo "  ✗ 转换失败，跳过"
    echo ""
    continue
  fi

  # 2. 打分
  echo "  → 筛选评分中（$PROVIDER）..."
  screen_args=("$md_file" -c "$CRITERIA" -p "$PROVIDER" -o "$json_file")
  [ -n "$MODEL" ] && screen_args+=(-m "$MODEL")
  [ -n "$BASE_URL" ] && screen_args+=(--base-url "$BASE_URL")

  if pnpm dev screen "${screen_args[@]}" 2>&1; then
    # 从 JSON 提取关键信息
    score=$(node -e "const r=JSON.parse(require('fs').readFileSync('$json_file','utf8')); console.log(r.score)")
    pass=$(node -e "const r=JSON.parse(require('fs').readFileSync('$json_file','utf8')); console.log(r.passed ? 'PASS' : 'FAIL')")
    summary=$(node -e "const r=JSON.parse(require('fs').readFileSync('$json_file','utf8')); console.log(r.summary)")

    echo ""
    echo "  结果: $pass | 分数: $score/100"
    echo "  摘要: $summary"

    if [ "$pass" = "PASS" ]; then
      passed=$((passed + 1))
    else
      failed=$((failed + 1))
    fi
  else
    echo "  ✗ 筛选失败"
    failed=$((failed + 1))
  fi

  echo ""
done

# 汇总
echo "========================================"
echo " 汇总"
echo "========================================"
echo " 总计: $total"
echo " 通过: $passed"
echo " 未通过: $failed"
echo ""
echo " MD 文件: $MD_DIR/"
echo " 评分结果: $OUTPUT_DIR/"
echo "========================================"

# 生成排名表
if [ -d "$OUTPUT_DIR" ] && ls "$OUTPUT_DIR"/*.json >/dev/null 2>&1; then
  echo ""
  echo "========================================"
  echo " 排名（按分数降序）"
  echo "========================================"
  node -e "
    const fs = require('fs');
    const path = require('path');
    const dir = '$OUTPUT_DIR';
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    const results = files.map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      return { name: f.replace('.json', ''), score: data.score, passed: data.passed, summary: data.summary };
    });
    results.sort((a, b) => b.score - a.score);
    results.forEach((r, i) => {
      const status = r.passed ? 'PASS' : 'FAIL';
      console.log('  ' + (i+1) + '. [' + status + '] ' + r.score + '分 — ' + r.name);
    });
  "
  echo "========================================"
fi
