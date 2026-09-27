# Workspace Rules: Tomato Cinema

## 1. Quy chuẩn Sơ đồ kỹ thuật & Trực quan hóa Kiến trúc (Diagram & Architecture Rule)

Mỗi khi tạo mới, cập nhật hoặc tinh chỉnh sơ đồ kỹ thuật (System Architecture, Sequence Lifecycle, Business Workflow, Dataflow Pipeline) cho hệ thống tài liệu `apps/docs` cũng như toàn bộ dự án `tomato_cinema`:

1. **Bắt buộc sử dụng Skill `archify`**:
   - Không sử dụng hình ảnh tĩnh (PNG/JPG mờ) hoặc sơ đồ đơn giản cho các luồng hệ thống cốt lõi.
   - Định nghĩa sơ đồ dưới dạng JSON đặc tả theo chuẩn Archify lưu tại `apps/docs/diagrams/<name>.json`.
   - Chọn đúng loại sơ đồ:
     - `architecture`: Kiến trúc hệ thống, ranh giới dịch vụ (boundaries), cluster, cloud, database.
     - `sequence`: Trình tự gọi API, vòng đời xác thực, luồng request-response.
     - `workflow` (schema_version: 2): Quy trình nghiệp vụ, lanes, phases, mainPath.
     - `dataflow`: Đường ống dữ liệu, ETL/ELT, streaming pipeline.
     - `lifecycle`: Vòng đời trạng thái, retry, terminal states.

2. **Tiêu chuẩn chất lượng Showcase (Showcase Quality Profile)**:
   - `meta.quality_profile`: Phải luôn đặt là `"showcase"`.
   - Bắt buộc kiểm tra xác thực trước khi kết xuất:
     ```bash
     node /home/tomato/.gemini/config/skills/archify/bin/archify.mjs validate <type> <file.json> --quality showcase --json
     ```
     Yêu cầu: Đạt đủ 9/9 checks (0 errors, 0 warnings).
   - Biên dịch và kết xuất file HTML tương tác độc lập vào `apps/docs/public/diagrams/<name>.html`:
     ```bash
     node /home/tomato/.gemini/config/skills/archify/bin/archify.mjs deliver <type> <file.json> apps/docs/public/diagrams/<name>.html --quality showcase --json
     ```

3. **Tích hợp vào Trang Web Tài liệu**:
   - Nhúng trực tiếp vào các trang MDX bằng component `<DiagramViewer src="/diagrams/<name>.html" title="..." />`.
   - Đảm bảo hỗ trợ đầy đủ các tính năng: Pan / Zoom, Tracing, Dark / Light mode và Xuất SVG/PNG.
