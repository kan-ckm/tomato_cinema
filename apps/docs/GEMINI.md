# Documentation Rules: apps/docs

## Quy định tạo & trực quan hóa Sơ đồ (Archify Mandatory Rule)

Mỗi khi tạo mới, cập nhật hoặc tinh chỉnh sơ đồ kỹ thuật cho trang web tài liệu:

1. **Bắt buộc sử dụng Skill `archify`**:
   - Định nghĩa sơ đồ dưới dạng JSON đặc tả theo chuẩn Archify lưu tại `apps/docs/diagrams/<name>.json`.
   - Chọn đúng loại sơ đồ: `architecture`, `sequence`, `workflow`, `dataflow`, hoặc `lifecycle`.

2. **Tiêu chuẩn chất lượng Showcase**:
   - `meta.quality_profile`: Luôn đặt `"showcase"`.
   - Xác thực: `node /home/tomato/.gemini/config/skills/archify/bin/archify.mjs validate <type> <file.json> --quality showcase --json` (Đạt 9/9 checks, 0 errors, 0 warnings).
   - Kết xuất: `node /home/tomato/.gemini/config/skills/archify/bin/archify.mjs deliver <type> <file.json> apps/docs/public/diagrams/<name>.html --quality showcase --json`.

3. **Tích hợp vào MDX**:
   - Nhúng trực tiếp vào các trang `.mdx` bằng component `<DiagramViewer src="/diagrams/<name>.html" title="..." />`.
