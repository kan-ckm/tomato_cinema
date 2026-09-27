# Rule: Bắt buộc dùng Archify tạo sơ đồ trên Web Docs

Áp dụng cho: Mọi tác vụ tạo mới, chỉnh sửa, nâng cấp sơ đồ kỹ thuật trong `apps/docs` và toàn dự án `tomato_cinema`.

## Hướng dẫn thực thi

1. **Engine tạo sơ đồ**: Luôn sử dụng skill `archify`.
2. **File nguồn**: Lưu file đặc tả JSON tại `apps/docs/diagrams/<name>.json`.
3. **Tiêu chuẩn Showcase**:
   - `meta.quality_profile: "showcase"`
   - Chạy lệnh xác thực đạt 9/9 checks (0 errors, 0 warnings):
     ```bash
     node /home/tomato/.gemini/config/skills/archify/bin/archify.mjs validate <type> <file.json> --quality showcase --json
     ```
   - Biên dịch ra HTML độc lập:
     ```bash
     node /home/tomato/.gemini/config/skills/archify/bin/archify.mjs deliver <type> <file.json> apps/docs/public/diagrams/<name>.html --quality showcase --json
     ```
4. **Nhúng vào MDX**: Sử dụng component `<DiagramViewer src="/diagrams/<name>.html" title="..." />`.
