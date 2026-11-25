import type { SkillSeedQuestion } from '../types.ts';

// 13 easy · 14 medium · 13 hard; 9 câu multiple_choice; 8 câu/domain.
// ML cổ điển, thuật ngữ theo scikit-learn 1.9 (không deep learning). Câu có số đã tính/mô phỏng bằng Python 3.13 thuần;
// hành vi thư viện đối chiếu scikit-learn.org/stable, khái niệm đối chiếu ISLR / ESL (nguồn từng câu ở báo cáo của đợt).
// Câu phụ thuộc cấu hình ghi rõ trong đề. Vị trí đúng và độ dài đáp án rải có chủ ý (validateBank strict kiểm).
export const MACHINE_LEARNING: SkillSeedQuestion[] = [
  // ───────────── Fundamentals & generalization ─────────────
  {
    domain: "Fundamentals & generalization",
    difficulty: "easy", type: "single_choice",
    stem: "Ba mô hình phân loại được đo accuracy trên tập train và tập validation (mức hợp lý cho bài toán này là khoảng 0.90):\n\n| Mô hình | Train | Validation |\n|---|---|---|\n| P | 0.99 | 0.71 |\n| Q | 0.72 | 0.70 |\n| R | 0.91 | 0.89 |\n\nĐọc bảng, nhận định nào đúng?",
    options: [
      { content: "P khớp tốt nhất vì accuracy train cao nhất; Q và R đều bị overfitting vì validation thấp hơn train" },
      { content: "P bị overfitting (train cao hơn validation rất nhiều); Q bị underfitting (cả hai đều thấp); R khớp hợp lý", correct: true },
      { content: "Q bị overfitting vì train và validation gần nhau; P và R đều bị underfitting vì validation thấp hơn train" },
      { content: "P bị underfitting vì validation thấp; Q khớp tốt nhất vì khoảng cách train–validation nhỏ nhất; R bị overfitting" },
    ],
  },
  {
    domain: "Fundamentals & generalization",
    difficulty: "easy", type: "single_choice",
    stem: "Nhóm dự đoán **số ngày** khách còn dùng dịch vụ (số nguyên từ 0 đến 365). Họ chấm mô hình bằng tỉ lệ đoán **trúng chính xác** số ngày, được 0.03, rồi kết luận mô hình vô dụng. Nhận định nào đúng?",
    options: [
      { content: "Coi mỗi số ngày là một lớp và huấn luyện bộ phân loại 366 lớp để tăng tỉ lệ đoán trúng" },
      { content: "Tỉ lệ trúng thấp do thiếu dữ liệu; thu thêm dữ liệu thì chỉ số này sẽ phản ánh đúng chất lượng" },
      { content: "Đây là bài toán hồi quy: đoán 120 khi thật là 121 vẫn bị tính sai, nên đo bằng MAE hoặc RMSE", correct: true },
      { content: "Chuẩn hoá nhãn về [0, 1] trước khi huấn luyện thì tỉ lệ đoán trúng chính xác sẽ đo đúng chất lượng" },
    ],
  },
  {
    domain: "Fundamentals & generalization",
    difficulty: "easy", type: "multiple_choice",
    stem: "Chọn các bài toán thuộc **supervised learning**.",
    options: [
      { content: "Dự đoán giá bán căn hộ từ diện tích và quận, dựa trên hàng nghìn giao dịch đã biết giá", correct: true },
      { content: "Chia 50 000 khách hàng thành các nhóm có hành vi mua tương tự khi chưa có nhóm nào được gắn tên" },
      { content: "Phân loại email là spam hay không dựa trên tập email người dùng đã gắn nhãn", correct: true },
      { content: "Tìm các giao dịch có mẫu chi tiêu khác thường trong lịch sử chưa gắn nhãn gian lận" },
    ],
  },
  {
    domain: "Fundamentals & generalization",
    difficulty: "medium", type: "single_choice",
    stem: "Learning curve của một mô hình (accuracy, trung bình 5-fold) khi tăng số mẫu train:\n\n| n train | Train | Validation |\n|---|---|---|\n| 500 | 0.74 | 0.68 |\n| 2 000 | 0.72 | 0.70 |\n| 8 000 | 0.71 | 0.71 |\n\nMục tiêu của dự án là accuracy ≥ 0.90. Hướng nào có triển vọng nhất?",
    options: [
      { content: "Dùng mô hình có khả năng biểu diễn cao hơn hoặc thêm đặc trưng có thông tin, vì hai đường cong đã hội tụ ở mức thấp", correct: true },
      { content: "Thu thập thêm dữ liệu gấp nhiều lần: khoảng cách train–validation còn nhỏ nên càng nhiều mẫu thì hai đường càng tiến gần 0.90" },
      { content: "Tăng mức regularization để thu hẹp khoảng cách còn lại giữa đường train và đường validation" },
      { content: "Giảm bớt số đặc trưng để mô hình đơn giản hơn, vì validation thấp hơn mục tiêu do overfitting" },
    ],
  },
  {
    domain: "Fundamentals & generalization",
    difficulty: "medium", type: "multiple_choice",
    stem: "Một mô hình tuyến tính có 300 đặc trưng, nhiều đặc trưng gần như vô ích, tất cả đã chuẩn hoá cùng thang. Ta tăng dần hệ số phạt `alpha` của `Ridge` (L2) và của `Lasso` (L1) trong scikit-learn. Chọn các nhận định đúng.",
    options: [
      { content: "Tăng alpha làm mô hình linh hoạt hơn nên lỗi train giảm, còn lỗi validation có thể tăng vì overfitting" },
      { content: "Với Lasso, khi alpha đủ lớn nhiều hệ số bị đưa về đúng 0, nên mô hình tự loại bớt đặc trưng", correct: true },
      { content: "Với Ridge, hệ số co dần về gần 0 nhưng thường không bằng đúng 0, nên số đặc trưng được giữ không giảm theo alpha", correct: true },
      { content: "Ridge cho mô hình thưa hơn Lasso vì phạt tổng bình phương nặng hơn phạt tổng trị tuyệt đối" },
    ],
  },
  {
    domain: "Fundamentals & generalization",
    difficulty: "medium", type: "single_choice",
    stem: "Tuỳ chỉnh `k` của KNN, lỗi phân loại (tỉ lệ sai) trên train và validation:\n\n| k | Train | Validation |\n|---|---|---|\n| 1 | 0.00 | 0.22 |\n| 5 | 0.08 | 0.15 |\n| 15 | 0.12 | 0.13 |\n| 50 | 0.20 | 0.21 |\n| 200 | 0.31 | 0.32 |\n\nNên chọn k nào, và giảm k từ 15 xuống 1 làm mô hình thay đổi thế nào?",
    options: [
      { content: "k = 15; giảm k làm mô hình đơn giản hơn vì mỗi dự đoán chỉ dựa vào một láng giềng duy nhất, nên k = 1 là underfitting" },
      { content: "k = 15; tăng k làm mô hình phức tạp hơn nên k = 50 (validation 0.21) là overfitting" },
      { content: "k = 15; giảm k làm bias tăng và variance giảm vì mỗi dự đoán chỉ nhớ một điểm" },
      { content: "k = 15; giảm k làm biên phức tạp hơn (variance cao): k = 1 thuộc lòng train, lỗi train 0 nhưng validation tăng", correct: true },
    ],
  },
  {
    domain: "Fundamentals & generalization",
    difficulty: "hard", type: "single_choice",
    stem: "Nhóm dữ liệu chia train / validation / test. Mỗi tuần họ huấn luyện mô hình, mở danh sách các mẫu **test** bị đoán sai, thêm đặc trưng nhắm vào những mẫu đó rồi đo lại accuracy trên test. Sau 10 tuần accuracy test tăng từ 0.82 lên 0.91 và họ định báo cáo 0.91 là hiệu năng khi triển khai. Đánh giá nào đúng?",
    options: [
      { content: "Hợp lệ: trọng số mô hình chỉ được huấn luyện trên train nên test chưa từng đi vào hàm mất mát, con số 0.91 không thiên lệch" },
      { content: "0.91 lạc quan vì test đã định hướng việc thiết kế đặc trưng nên không còn là dữ liệu chưa từng thấy; cần holdout mới", correct: true },
      { content: "0.91 lạc quan, nhưng chạy 5-fold CV trên train + test gộp với bộ đặc trưng cuối sẽ cho ước lượng không thiên lệch" },
      { content: "0.91 lạc quan; báo trung bình accuracy test của cả 10 tuần (≈ 0.86) là hết thiên lệch" },
    ],
  },
  {
    domain: "Fundamentals & generalization",
    difficulty: "hard", type: "multiple_choice",
    stem: "Tại một điểm x0 có giá trị thật y = 50, ta huấn luyện lại hai loại mô hình trên 5 tập train khác nhau (cùng phân phối) và ghi dự đoán tại x0 (bỏ qua nhiễu của y):\n\n- Mô hình A (cây nông): 44, 45, 43, 44, 44\n- Mô hình B (cây sâu): 50, 58, 43, 47, 52\n\nChọn các nhận định đúng (variance tính theo công thức chia cho 5).",
    options: [
      { content: "A đáng tin hơn B vì dự đoán ổn định giữa các lần huấn luyện, nên sai số bình phương kỳ vọng của A nhỏ hơn" },
      { content: "A có bias lớn (trung bình dự đoán 44, lệch 6) và variance rất nhỏ (≈ 0.4)", correct: true },
      { content: "B có bias lớn vì có những lần dự đoán lệch xa 50, ví dụ 58 và 43" },
      { content: "Tại x0, sai số bình phương kỳ vọng của B (≈ 25) nhỏ hơn của A (≈ 36), dù variance của B lớn hơn nhiều", correct: true },
    ],
  },

  // ───────────── Data preparation & features ─────────────
  {
    domain: "Data preparation & features",
    difficulty: "easy", type: "single_choice",
    stem: "Ngân hàng dự đoán khách hàng **sẽ vỡ nợ** hay không, mô hình dùng ngay lúc xét duyệt khoản vay. Mô hình đạt AUC 0.99 trên validation, cao bất thường. Đặc trưng nào dưới đây nhiều khả năng gây data leakage?",
    options: [
      { content: "`thu_nhap_thang`: thu nhập hằng tháng khách khai báo khi nộp hồ sơ" },
      { content: "`so_nam_di_lam`: số năm làm việc của khách theo xác nhận của công ty chủ quản" },
      { content: "`so_lan_nhac_no`: số lần ngân hàng đã gửi thư nhắc nợ cho khoản vay đó", correct: true },
      { content: "`diem_tin_dung`: điểm do trung tâm tín dụng chấm ở lần tra cứu gần nhất trước khi xét duyệt" },
    ],
  },
  {
    domain: "Data preparation & features",
    difficulty: "easy", type: "single_choice",
    stem: "Cột `mau` có ba giá trị `do`, `xanh`, `vang`, không có thứ tự tự nhiên. Một bạn mã hoá thành 0, 1, 2 rồi đưa vào `LinearRegression`. Vấn đề chính là gì?",
    options: [
      { content: "Mô hình ngầm coi `vang` > `xanh` > `do` với khoảng cách đều nhau; thứ tự đó không có thật nên cần one-hot", correct: true },
      { content: "Giá trị 0 làm hệ số của cột bị triệt tiêu, nên mô hình bỏ qua các mẫu có màu `do`" },
      { content: "Cột số nguyên không đưa được vào mô hình tuyến tính của scikit-learn, phải đổi sang chuỗi hoặc float trước khi huấn luyện" },
      { content: "Mô hình dựa trên cây bị ảnh hưởng bởi thứ tự này, còn mô hình tuyến tính thì không" },
    ],
  },
  {
    domain: "Data preparation & features",
    difficulty: "easy", type: "multiple_choice",
    stem: "Dữ liệu khách hàng có `tuoi` (18–65), `thu_nhap` (5 triệu – 200 triệu VND) và `so_con` (0–5), chưa chuẩn hoá thang đo. Chọn các mô hình mà kết quả bị ảnh hưởng đáng kể bởi việc này.",
    options: [
      { content: "`KNeighborsClassifier` (k = 5)", correct: true },
      { content: "`DecisionTreeClassifier` (max_depth=5)" },
      { content: "`SVC(kernel=\"rbf\")`", correct: true },
      { content: "`LogisticRegression(C=1.0)`, phạt L2", correct: true },
      { content: "`RandomForestClassifier` (100 cây)" },
    ],
  },
  {
    domain: "Data preparation & features",
    difficulty: "medium", type: "single_choice",
    stem: "Cột `thu_nhap` thiếu ở 30% hồ sơ vay; nhóm bị thiếu vỡ nợ 25%, nhóm có khai vỡ nợ 5%. Nhóm đánh giá mô hình như sau:\n\n```python\nmodel = make_pipeline(SimpleImputer(strategy=\"mean\"), StandardScaler(), LogisticRegression())\nscores = cross_val_score(model, X, y, cv=5)\n```\n\nCải tiến nào hợp lý nhất?",
    options: [
      { content: "Điểm CV bị rò rỉ vì `SimpleImputer` tính trung bình trên toàn bộ X trước khi chia fold" },
      { content: "Thêm cờ báo thiếu bằng `SimpleImputer(add_indicator=True)`, vì việc thiếu tự nó mang tín hiệu", correct: true },
      { content: "Bỏ các dòng thiếu `thu_nhap` để mô hình chỉ học trên dữ liệu đầy đủ và sạch hơn" },
      { content: "Đổi sang `strategy=\"median\"`, vì median bền với ngoại lai hơn và thu nhập thường lệch phải" },
    ],
  },
  {
    domain: "Data preparation & features",
    difficulty: "medium", type: "single_choice",
    stem: "Dữ liệu gốc có 2% mẫu dương. Một bạn cân bằng lớp trước khi đánh giá:\n\n```python\nX_res, y_res = RandomOverSampler(random_state=0).fit_resample(X, y)  # imbalanced-learn\nscores = cross_val_score(clf, X_res, y_res, cv=5, scoring=\"recall\")\n```\n\nRecall CV ≈ 0.96, nhưng trên dữ liệu mới (cùng nguồn, cùng phân phối) recall chỉ 0.40. Nguyên nhân chính là gì?",
    options: [
      { content: "Bản sao của một mẫu dương nằm cả ở train lẫn validation nên mô hình nhận lại thứ đã thấy; phải lấy mẫu lại trong từng fold, chỉ trên train", correct: true },
      { content: "Recall không phù hợp để đo trên dữ liệu đã cân bằng nên điểm cao bất thường; đổi sang accuracy sẽ phản ánh đúng chất lượng hơn" },
      { content: "Dữ liệu mới có phân phối khác dữ liệu huấn luyện (distribution shift) nên điểm giảm là bình thường, không liên quan đến quy trình CV" },
      { content: "5 fold là quá ít cho lớp hiếm; tăng lên `cv=20` thì recall CV sẽ sát với recall trên dữ liệu mới, vì mỗi lần huấn luyện có thêm mẫu dương" },
    ],
  },
  {
    domain: "Data preparation & features",
    difficulty: "medium", type: "single_choice",
    stem: "Dự đoán khách hàng có rời bỏ dịch vụ trong tháng kế tiếp, từ dữ liệu 24 tháng gần nhất. Mỗi dòng là một cặp (khách, tháng), đặc trưng gồm `thang` (1–24) và số lần sử dụng 3 tháng gần nhất; dữ liệu đã xếp theo thời gian và mô hình có bước `StandardScaler`. `KFold(shuffle=True)` cho AUC 0.92, nhưng sau khi triển khai AUC chỉ còn 0.74. Cách đánh giá nào phản ánh **sát nhất** cách dùng khi triển khai?",
    options: [
      { content: "Giữ `KFold(shuffle=True)` nhưng đưa `StandardScaler` vào `Pipeline` để hết rò rỉ giữa các fold" },
      { content: "`GroupKFold` theo mã khách để một khách không nằm ở cả hai phía train và validation" },
      { content: "Huấn luyện trên các tháng trước, kiểm tra trên tháng sau (`TimeSeriesSplit`), đúng thứ tự như khi triển khai", correct: true },
      { content: "Bỏ cột `thang` rồi giữ `KFold(shuffle=True)`, để mô hình không còn học được xu hướng theo thời gian" },
    ],
  },
  {
    domain: "Data preparation & features",
    difficulty: "hard", type: "single_choice",
    stem: "50 mẫu, 2 000 đặc trưng N(0, 1) độc lập; nhãn nhị phân cân bằng, sinh ngẫu nhiên và **độc lập hoàn toàn** với đặc trưng. Quy trình A: chọn 20 đặc trưng có |tương quan| với nhãn cao nhất trên **cả 50 mẫu**, rồi 5-fold CV bộ phân loại (nearest centroid) trên 20 đặc trưng đó. Quy trình B giống A nhưng việc chọn 20 đặc trưng làm lại bên trong từng fold, chỉ dùng phần train của fold. Kết quả kỳ vọng?",
    options: [
      { content: "Cả hai xấp xỉ 0.5, vì nhãn không phụ thuộc đặc trưng nên không quy trình nào vượt được đoán ngẫu nhiên" },
      { content: "Cả hai cao hơn 0.5 như nhau, vì chọn 20 đặc trưng tốt nhất từ 2 000 đặc trưng luôn làm mô hình tốt lên dù chúng là nhiễu" },
      { content: "A xấp xỉ 0.5 còn B cao hơn, vì chọn đặc trưng trong từng fold khớp hơn với từng tập train" },
      { content: "A cao hơn 0.5 rõ rệt (mô phỏng cho khoảng 0.9 trở lên) dù không có tín hiệu thật; B xấp xỉ 0.5 mới phản ánh đúng", correct: true },
    ],
  },
  {
    domain: "Data preparation & features",
    difficulty: "hard", type: "single_choice",
    stem: "Cột `ma_buu_dien` có khoảng 3 000 giá trị, đa số chỉ xuất hiện 1–3 lần. Một bạn thay cột bằng **trung bình nhãn của từng mã tính trên toàn bộ tập train** (target mean encoding), rồi huấn luyện gradient boosting trên chính tập train đó. Kết quả: AUC train 0.99, AUC validation 0.62. Nguyên nhân chính là gì?",
    options: [
      { content: "Gradient boosting overfit vì có quá nhiều cây; chỉ cần giảm `n_estimators` là AUC validation tiến sát AUC train" },
      { content: "Mã bưu điện chưa xuất hiện ở train nhận giá trị thiếu khi sang validation, nên AUC thấp là do thiếu dữ liệu chứ không phải lỗi quy trình" },
      { content: "Target encoding sinh ra giá trị liên tục mà gradient boosting không dùng tốt, nên phải làm tròn đặc trưng đã mã hoá về 0 hoặc 1" },
      { content: "Với mã hiếm, giá trị mã hoá của một dòng gần như chính nhãn của dòng đó (nhãn train rò vào đặc trưng); cần mã hoá out-of-fold hoặc làm mượt", correct: true },
    ],
  },

  // ───────────── Supervised algorithms ─────────────
  {
    domain: "Supervised algorithms",
    difficulty: "easy", type: "single_choice",
    stem: "Dữ liệu hai lớp trên mặt phẳng (x1, x2): lớp 0 gồm các điểm quanh gốc toạ độ trong bán kính 1; lớp 1 nằm trên một vòng quanh gốc, bán kính khoảng 3. `LogisticRegression` chỉ dùng hai toạ độ này đạt accuracy xấp xỉ 0.5, còn `SVC(kernel=\"rbf\")` trên cùng dữ liệu đạt khoảng 0.99. Vì sao?",
    options: [
      { content: "Biên quyết định của logistic regression là đường thẳng trong (x1, x2) nên không bao được lớp ở giữa; kernel RBF cho biên phi tuyến", correct: true },
      { content: "Logistic regression giả định hai lớp có cùng phương sai; ở đây lớp 1 phân tán hơn nên kết quả chỉ là ngẫu nhiên" },
      { content: "SVC thắng vì thuật toán tối đa hoá margin nên cho accuracy cao hơn logistic regression khi hai lớp không tách tuyến tính" },
      { content: "Thuật toán chưa hội tụ; tăng `max_iter` đủ lớn thì logistic regression sẽ tìm ra đường tròn phân tách hai lớp" },
    ],
  },
  {
    domain: "Supervised algorithms",
    difficulty: "easy", type: "single_choice",
    stem: "Một `KNeighborsClassifier(n_neighbors=5, algorithm=\"brute\")` được huấn luyện trên 2 triệu mẫu. Quan sát: `fit` gần như tức thì, nhưng `predict` cho 10 000 mẫu mới rất chậm. Giải thích nào đúng?",
    options: [
      { content: "`fit` đã tính sẵn nhãn dự đoán cho từng mẫu train nên `predict` chậm chỉ vì phải đọc các kết quả đó từ đĩa lên bộ nhớ" },
      { content: "`predict` chạy gradient descent trên toàn bộ 2 triệu mẫu để cập nhật trọng số cho mỗi mẫu mới cần dự đoán" },
      { content: "KNN chỉ lưu dữ liệu ở `fit`; mỗi mẫu mới phải tìm láng giềng gần nhất trong dữ liệu đã lưu nên chi phí dồn vào `predict`", correct: true },
      { content: "KNN phải huấn luyện lại toàn bộ mô hình sau mỗi mẫu mới đến, vì vậy `predict` chậm hơn `fit` rất nhiều" },
    ],
  },
  {
    domain: "Supervised algorithms",
    difficulty: "easy", type: "multiple_choice",
    stem: "Một `DecisionTreeClassifier` không giới hạn độ sâu có accuracy train 1.00 nhưng validation chỉ 0.78. Chọn các thay đổi làm cây **bớt phức tạp** để giảm overfitting.",
    options: [
      { content: "Đổi `criterion` từ `\"gini\"` sang `\"entropy\"`" },
      { content: "Đặt `max_depth=5`", correct: true },
      { content: "Tăng `min_samples_leaf` lên 20", correct: true },
      { content: "Tăng `ccp_alpha` lên giá trị dương (cắt tỉa)", correct: true },
    ],
  },
  {
    domain: "Supervised algorithms",
    difficulty: "medium", type: "single_choice",
    stem: "Gradient boosting (cây nông) với hai `learning_rate`; accuracy validation theo số cây:\n\n| n_estimators | lr = 0.5 | lr = 0.05 |\n|---|---|---|\n| 50 | 0.88 | 0.78 |\n| 100 | 0.86 | 0.83 |\n| 200 | 0.83 | 0.87 |\n| 400 | 0.80 | 0.89 |\n| 800 | 0.77 | 0.89 |\n\nNhận định nào đúng?",
    options: [
      { content: "Cả hai cấu hình nên dùng 800 cây vì boosting không overfit khi thêm cây, giống như random forest khi tăng số cây" },
      { content: "Hai learning rate chỉ khác nhau về tốc độ huấn luyện: đủ cây thì cả hai đạt cùng một mức validation" },
      { content: "lr = 0.5 học nhanh rồi overfit nên validation giảm khi thêm cây; lr = 0.05 cần nhiều cây hơn nhưng đạt 0.89", correct: true },
      { content: "lr = 0.05 bị underfit ở các số cây trong bảng, nên cần tăng learning_rate lên 0.5 mới đạt validation cao nhất" },
    ],
  },
  {
    domain: "Supervised algorithms",
    difficulty: "medium", type: "multiple_choice",
    stem: "Chọn các nhận định đúng khi so sánh random forest với một cây quyết định sâu duy nhất.",
    options: [
      { content: "Tăng `n_estimators` từ 100 lên 1 000 làm rừng dễ overfit hơn vì mỗi cây thêm vào đều là cây sâu" },
      { content: "Lợi ích chính so với một cây sâu là giảm bias, vì trung bình nhiều cây bắt được quan hệ phức tạp hơn" },
      { content: "Mỗi cây học trên một mẫu bootstrap; dự đoán cuối là bỏ phiếu hoặc trung bình các cây", correct: true },
      { content: "Chọn ngẫu nhiên tập con đặc trưng ở mỗi nút làm các cây ít tương quan, nên trung bình giảm variance tốt hơn", correct: true },
    ],
  },
  {
    domain: "Supervised algorithms",
    difficulty: "medium", type: "single_choice",
    stem: "Hồi quy tuyến tính dự đoán cân nặng dùng hai cột chiều cao đến từ hai cảm biến khác nhau: `chieu_cao_cm` và `chieu_cao_inch` (tương quan 0.999). Khi huấn luyện lại trên các mẫu con khác nhau, hệ số của hai cột dao động rất mạnh (ví dụ +9.8 / −22.4, rồi +14.1 / −33.3), trong khi dự đoán cân nặng gần như không đổi. Điều nào đúng?",
    options: [
      { content: "Mô hình overfit nặng nên dự đoán sẽ tệ trên dữ liệu mới; cần thu thập thêm mẫu hoặc giảm số đặc trưng" },
      { content: "Hệ số dao động cho thấy cả hai cột không liên quan đến cân nặng nên cần loại cả hai cột khỏi mô hình" },
      { content: "Đây là lỗi của solver; nếu dữ liệu cùng phân phối thì hệ số phải giống nhau giữa mọi lần huấn luyện" },
      { content: "Đa cộng tuyến: dự đoán vẫn ổn nhưng hệ số từng cột khó diễn giải; bỏ bớt một cột hoặc dùng Ridge", correct: true },
    ],
  },
  {
    domain: "Supervised algorithms",
    difficulty: "hard", type: "single_choice",
    stem: "Dữ liệu một đặc trưng: x = 1, 2, 3, 4, 5, 6 với nhãn 0, 0, 0, 1, 1, 1 (tách tuyến tính hoàn toàn). Huấn luyện logistic regression bằng cực đại likelihood thuần, **không regularization** (trong scikit-learn: `LogisticRegression(C=np.inf)`). Điều gì đúng với hệ số của x?",
    options: [
      { content: "Hội tụ về nghiệm hữu hạn duy nhất vì log-loss là hàm lồi, nên giá trị không phụ thuộc `tol` hay số vòng lặp" },
      { content: "Không có hệ số tối ưu hữu hạn: log-loss còn giảm khi hệ số tăng, nên giá trị nhận được phụ thuộc lúc solver dừng", correct: true },
      { content: "Hội tụ về 0, vì dữ liệu tách hoàn toàn nên x không còn mang thêm thông tin nào để phân biệt hai lớp" },
      { content: "Báo lỗi ngay từ vòng lặp đầu vì ma trận Hessian suy biến khi dữ liệu tách tuyến tính hoàn toàn, nên phải thêm regularization mới chạy được" },
    ],
  },
  {
    domain: "Supervised algorithms",
    difficulty: "hard", type: "single_choice",
    stem: "KNN (k = 5) trên 5 đặc trưng có tín hiệu (cùng thang) đạt accuracy validation khoảng 0.98. Thêm 500 đặc trưng nhiễu N(0, 1) độc lập với nhãn, cùng thang đo, thì accuracy còn khoảng 0.77–0.87. Giải thích nào đúng?",
    options: [
      { content: "KNN tự giảm trọng số của đặc trưng không liên quan tới nhãn, nên mức giảm chỉ là dao động ngẫu nhiên của tập validation" },
      { content: "Khoảng cách Euclid cộng dồn 500 chiều nhiễu, lấn át 5 chiều có tín hiệu nên láng giềng gần như ngẫu nhiên; cần chọn đặc trưng", correct: true },
      { content: "Nhiễu cộng cùng một lượng vào khoảng cách tới mọi điểm, nên thứ hạng láng giềng không đổi; accuracy giảm vì k quá nhỏ" },
      { content: "Đặc trưng nhiễu làm mô hình underfit, nên tăng k lên thật lớn là khôi phục lại được accuracy 0.98" },
    ],
  },

  // ───────────── Model evaluation ─────────────
  {
    domain: "Model evaluation",
    difficulty: "easy", type: "single_choice",
    stem: "Hệ thống phát hiện gian lận: 10 000 giao dịch trong đó có 100 giao dịch gian lận. Một mô hình luôn dự đoán \"bình thường\" cho mọi giao dịch và đạt accuracy 0.99. Nhận định nào đúng?",
    options: [
      { content: "Mô hình rất tốt: accuracy 0.99 gần tuyệt đối nên chỉ cần tinh chỉnh thêm một chút là có thể đưa vào triển khai" },
      { content: "Mô hình vẫn dùng được vì recall của lớp bình thường là 1.0, nghĩa là không có giao dịch bình thường nào bị chặn nhầm" },
      { content: "Accuracy đánh lừa vì lớp lệch: recall của lớp gian lận bằng 0, nên cần xem recall, precision hoặc PR-AUC của lớp gian lận", correct: true },
      { content: "Nên bỏ bớt giao dịch bình thường khỏi tập test để tỉ lệ cân bằng, khi đó accuracy sẽ phản ánh đúng chất lượng" },
    ],
  },
  {
    domain: "Model evaluation",
    difficulty: "easy", type: "single_choice",
    stem: "`r2_score(y_test, y_pred)` của scikit-learn trả về −0.35 cho một mô hình hồi quy. Diễn giải nào đúng?",
    options: [
      { content: "Mô hình dự đoán tệ hơn cách luôn trả về giá trị trung bình của `y_test` (một baseline hằng số)", correct: true },
      { content: "Không thể xảy ra vì R² chỉ nằm trong khoảng [0, 1], nên chắc chắn đã có lỗi trong tính toán" },
      { content: "Mô hình giải thích 35% phương sai của y nhưng theo chiều ngược lại, tức là có tương quan âm với giá trị thật" },
      { content: "Sai số trung bình của mô hình bằng 0.35 đơn vị của y, dấu âm chỉ hướng lệch của dự đoán" },
    ],
  },
  {
    domain: "Model evaluation",
    difficulty: "medium", type: "single_choice",
    stem: "Mô hình cho điểm xác suất lớp dương cho 10 mẫu (nhãn 1 là dương):\n\n| Điểm | 0.95 | 0.85 | 0.80 | 0.70 | 0.55 | 0.45 | 0.40 | 0.30 | 0.20 | 0.10 |\n|---|---|---|---|---|---|---|---|---|---|---|\n| Nhãn | 1 | 1 | 0 | 1 | 0 | 1 | 0 | 1 | 0 | 0 |\n\nDự đoán dương khi điểm ≥ ngưỡng. Hạ ngưỡng từ 0.5 xuống 0.35 thì (precision, recall) của lớp dương là bao nhiêu?",
    options: [
      { content: "precision = 0.75, recall = 0.60" },
      { content: "precision = 0.60, recall = 0.80" },
      { content: "precision = 0.57, recall = 0.80", correct: true },
      { content: "precision = 0.80, recall = 0.57" },
    ],
  },
  {
    domain: "Model evaluation",
    difficulty: "medium", type: "single_choice",
    stem: "Bộ dữ liệu X-quang có 6 000 ảnh của 300 bệnh nhân (khoảng 20 ảnh mỗi người), nhãn theo bệnh nhân. `KFold(5, shuffle=True)` cho AUC 0.97, nhưng khi thử trên bệnh nhân mới AUC chỉ 0.78. Cách đánh giá nào đúng?",
    options: [
      { content: "`StratifiedKFold(5, shuffle=True)` để mỗi fold giữ đúng tỉ lệ có bệnh / không bệnh" },
      { content: "`KFold` với 20 fold để mỗi lần kiểm tra chỉ có ít ảnh và mỗi lần huấn luyện có nhiều ảnh hơn, làm AUC ổn định" },
      { content: "`train_test_split` ngẫu nhiên một lần 80/20 thay cho CV, để ảnh không bị lấy lại nhiều lần" },
      { content: "`GroupKFold(5)` với `groups=patient_id`, để ảnh của một bệnh nhân không nằm cả ở train lẫn validation", correct: true },
    ],
  },
  {
    domain: "Model evaluation",
    difficulty: "medium", type: "single_choice",
    stem: "Hai mô hình dự đoán thời gian giao hàng; độ lệch tuyệt đối (phút) giữa giờ giao thực tế và dự đoán trên 10 đơn:\n\n- A: 3, 3, 3, 3, 3, 3, 3, 3, 3, 3\n- B: 1, 1, 1, 1, 1, 1, 1, 1, 1, 21\n\nVới doanh nghiệp, thiệt hại của một đơn lệch lớn tăng rất nhanh theo mức lệch (một đơn lệch 21 phút tệ hơn nhiều so với 7 đơn lệch 3 phút). Nhận định nào đúng?",
    options: [
      { content: "Chọn B: nếu loại lỗi 21 (coi là ngoại lai) thì RMSE của B còn 1.0, thấp hơn hẳn RMSE của A (3.0)" },
      { content: "Hai mô hình tương đương: MAE bằng nhau (3.0) nên RMSE cũng bằng nhau (3.0)" },
      { content: "Chọn A: MAE đều 3.0 nhưng RMSE của B ≈ 6.7 còn A là 3.0, vì lỗi 21 bị bình phương", correct: true },
      { content: "Không đủ thông tin để so sánh, vì hai mô hình có MAE bằng nhau" },
    ],
  },
  {
    domain: "Model evaluation",
    difficulty: "hard", type: "single_choice",
    stem: "Hệ thống cảnh báo có 100 000 mẫu âm và 500 mẫu dương (0.5%). Mô hình có ROC-AUC = 0.95. Tại ngưỡng vận hành, TPR (recall) = 0.80 và FPR = 0.05. Precision của lớp dương tại ngưỡng đó xấp xỉ bao nhiêu?",
    options: [
      { content: "≈ 0.95: FPR = 0.05 nghĩa là 5% số cảnh báo là báo động giả" },
      { content: "≈ 0.94: precision = 0.80 / (0.80 + 0.05)" },
      { content: "≈ 0.88: trung bình của TPR (0.80) và 1 − FPR (0.95)" },
      { content: "≈ 0.07: có 400 TP nhưng khoảng 5 000 FP", correct: true },
    ],
  },
  {
    domain: "Model evaluation",
    difficulty: "hard", type: "multiple_choice",
    stem: "Chọn các nhận định đúng về ROC-AUC của một mô hình phân loại nhị phân cho điểm xác suất s ∈ (0, 1).",
    options: [
      { content: "ROC-AUC bằng 0.5 nghĩa là mô hình chỉ đoán đúng khoảng một nửa số mẫu ở ngưỡng 0.5, ngang đoán ngẫu nhiên" },
      { content: "Xếp hạng theo ROC-AUC và theo accuracy ở ngưỡng 0.5 có thể ngược nhau, vì AUC chỉ đo thứ tự xếp hạng, không đo một ngưỡng cụ thể", correct: true },
      { content: "ROC-AUC là xác suất một mẫu bất kỳ trong tập kiểm tra được mô hình dự đoán đúng nhãn ở ngưỡng 0.5" },
      { content: "Thay mọi điểm s bằng s³ hoặc log s (hàm tăng đơn điệu) không làm thay đổi ROC-AUC", correct: true },
    ],
  },
  {
    domain: "Model evaluation",
    difficulty: "hard", type: "single_choice",
    stem: "Hai mô hình A, B được chấm trên cùng 400 mẫu validation: A đúng 362 mẫu (0.905), B đúng 366 mẫu (0.915). Trong 400 mẫu có 14 mẫu A đúng / B sai và 18 mẫu A sai / B đúng; số còn lại hai mô hình cùng đúng hoặc cùng sai. Kết luận nào hợp lý?",
    options: [
      { content: "B tốt hơn A vì 0.915 > 0.905; với 400 mẫu chênh lệch này đủ ý nghĩa để chọn B" },
      { content: "B tốt hơn: trong các mẫu hai mô hình bất đồng, B đúng 18 còn A chỉ đúng 14" },
      { content: "Chưa đủ bằng chứng B tốt hơn: chỉ 32 mẫu bất đồng, chia gần đôi (18 so với 14); p ≈ 0.6", correct: true },
      { content: "A và B tốt như nhau: p ≈ 0.6 > 0.05 chứng tỏ hai mô hình có cùng độ chính xác thật" },
    ],
  },

  // ───────────── Unsupervised learning ─────────────
  {
    domain: "Unsupervised learning",
    difficulty: "easy", type: "single_choice",
    stem: "Chạy `KMeans` với k = 1 đến 6 trên cùng dữ liệu, inertia lần lượt là 1000, 520, 280, 250, 235, 225. Chọn k theo phương pháp elbow, đáp án nào đúng?",
    options: [
      { content: "k = 6, vì có inertia nhỏ nhất trong bảng nên các cụm chặt nhất và khớp dữ liệu nhất" },
      { content: "k = 3, vì từ đó thêm cụm chỉ giảm inertia rất ít (280 → 250 → 235) so với các bước đầu", correct: true },
      { content: "k = 2, vì bước giảm lớn nhất là từ k = 1 sang k = 2 (giảm 480) nên cụm thứ hai đóng góp nhiều nhất" },
      { content: "k = 5, vì inertia vẫn còn giảm đều ở mỗi bước cho đến đó, chưa có dấu hiệu dừng lại" },
    ],
  },
  {
    domain: "Unsupervised learning",
    difficulty: "easy", type: "single_choice",
    stem: "Phân cụm phân cấp (agglomerative) trên một tập dữ liệu. Cắt dendrogram ở một mức được 3 cụm, rồi cắt ở mức cao hơn được 2 cụm. Nhận định nào đúng?",
    options: [
      { content: "Phải chạy lại thuật toán với số cụm mới, vì cũng như k-means, số cụm phải được chọn trước khi chạy" },
      { content: "2 cụm có được bằng cách gộp hai trong ba cụm; không điểm nào chuyển chéo vì các mức cắt lồng nhau", correct: true },
      { content: "Hai cụm mới có thể chia lại điểm của cả ba cụm cũ, giống như chạy lại k-means với k = 2" },
      { content: "Kết quả cắt phụ thuộc khởi tạo ngẫu nhiên nên mỗi lần chạy lại có thể cho một dendrogram khác" },
    ],
  },
  {
    domain: "Unsupervised learning",
    difficulty: "medium", type: "multiple_choice",
    stem: "`DBSCAN(eps=0.3, min_samples=5)` chạy trên 1 000 điểm gồm hai đám dữ liệu hình chữ S lồng vào nhau cùng 50 điểm rải rác. Nhãn trả về: 0 (480 điểm), 1 (470 điểm), −1 (50 điểm). Chọn các nhận định đúng.",
    options: [
      { content: "Có 2 cụm; 50 điểm mang nhãn −1 là nhiễu, không thuộc cụm nào", correct: true },
      { content: "Tăng `eps` đủ nhiều làm hai đám nhập thành một cụm và giảm số điểm nhiễu", correct: true },
      { content: "Có 3 cụm; cụm −1 là cụm nhỏ nhất và có thể dùng làm nhóm điểm bất thường" },
      { content: "Một `eps` chung xử lý tốt cả cụm đặc lẫn cụm thưa mà không cần chỉnh thêm gì" },
    ],
  },
  {
    domain: "Unsupervised learning",
    difficulty: "medium", type: "single_choice",
    stem: "`KMeans(n_clusters=4, init=\"random\", n_init=1)` chạy trên cùng dữ liệu với hai `random_state` khác nhau cho hai kết quả: inertia 412.3 (phân cụm X) và 305.8 (phân cụm Y). Cách xử lý hợp lý là gì?",
    options: [
      { content: "Đó là cực tiểu địa phương, phụ thuộc khởi tạo: tăng `n_init` (hoặc dùng k-means++) và giữ phân cụm có inertia thấp nhất", correct: true },
      { content: "Chọn X, vì inertia cao hơn nghĩa là các cụm phân tán rộng hơn nên giữ được nhiều thông tin của dữ liệu hơn" },
      { content: "Lấy trung bình các tâm cụm tương ứng của X và Y rồi gán lại mẫu để được phân cụm ổn định hơn" },
      { content: "Đây là lỗi thư viện vì kết quả đúng phải giống nhau; cố định một `random_state` rồi dùng kết quả đó, không cần chạy lại nhiều lần" },
    ],
  },
  {
    domain: "Unsupervised learning",
    difficulty: "hard", type: "single_choice",
    stem: "Dữ liệu hai lớp, hai đặc trưng: đặc trưng 1 có độ lệch chuẩn 10 và phân phối giống nhau ở cả hai lớp; đặc trưng 2 có trung bình −1 ở lớp 0 và +1 ở lớp 1, độ lệch chuẩn trong lớp 0.3. Áp `PCA(n_components=1)` (giữ khoảng 99% phương sai) rồi phân loại bằng thành phần thu được, accuracy chỉ còn khoảng 0.53; dùng riêng đặc trưng 2 thì gần 1.0. Nguyên nhân là gì?",
    options: [
      { content: "PCA làm méo khoảng cách giữa các mẫu, nên các bộ phân loại đều mất độ chính xác sau khi giảm chiều dù giữ nhiều phương sai" },
      { content: "Do chưa chuẩn hoá: thêm `StandardScaler` trước PCA thì PC1 sẽ trùng đặc trưng 2 và accuracy về gần 1.0" },
      { content: "Giữ 99% phương sai tức là giữ 99% thông tin phân lớp; accuracy thấp là do bộ phân loại chưa được tinh chỉnh siêu tham số kỹ lưỡng" },
      { content: "PCA không nhìn nhãn: nó giữ hướng phương sai lớn nhất (nhiễu của đặc trưng 1), còn hướng phân biệt hai lớp có phương sai nhỏ nên bị bỏ", correct: true },
    ],
  },
  {
    domain: "Unsupervised learning",
    difficulty: "hard", type: "multiple_choice",
    stem: "Một biểu đồ t-SNE 2D của 5 000 mẫu cho thấy ba nhóm: A và B cách xa nhau, C nằm sát B, và nhóm A trông rộng gấp ba nhóm B. Chọn các nhận định đúng.",
    options: [
      { content: "Với `TSNE` của scikit-learn, có thể huấn luyện trên tập train rồi gọi `transform` cho mẫu mới để dùng làm đặc trưng cho bộ phân loại" },
      { content: "Ba nhóm tách rời cho thấy k-means với k = 3 trên không gian gốc sẽ cho đúng ba nhóm đó" },
      { content: "Không nên kết luận A khác B nhiều hơn C khác B: khoảng cách giữa các nhóm trên t-SNE không phản ánh khoảng cách thật trong không gian gốc", correct: true },
      { content: "Độ rộng của mỗi nhóm không phản ánh độ phân tán thật trong không gian gốc, và đổi `perplexity` làm thay đổi đáng kể bố cục", correct: true },
    ],
  },
  {
    domain: "Unsupervised learning",
    difficulty: "hard", type: "single_choice",
    stem: "Dữ liệu hai hình trăng lồng nhau, 400 điểm. DBSCAN gán mọi điểm vào đúng hai trăng (khớp nhãn thật 100%, không có nhãn −1). `KMeans(n_clusters=2)` cắt ngang hai trăng (khớp khoảng 75%). `silhouette_score`: KMeans ≈ 0.49, DBSCAN ≈ 0.33. Kết luận nào đúng?",
    options: [
      { content: "KMeans phù hợp hơn cho dữ liệu này vì silhouette cao hơn; nên chuyển sang DBSCAN khi silhouette của nó vượt KMeans" },
      { content: "Silhouette ưu ái cụm lồi nên cách chia đúng hai trăng vẫn có điểm thấp hơn; không nên chọn mô hình chỉ dựa vào chỉ số này", correct: true },
      { content: "Silhouette của DBSCAN thấp vì `eps` quá nhỏ nên điểm sát biên bị tính nhầm; cần tăng `eps` đến khi silhouette vượt 0.49" },
      { content: "Silhouette 0.33 cho thấy hai trăng chỉ là cấu trúc yếu, nên nhãn khớp 100% của DBSCAN phản ánh dữ liệu ít nhiễu chứ không phải phân cụm tốt" },
    ],
  },
  {
    domain: "Unsupervised learning",
    difficulty: "hard", type: "single_choice",
    stem: "Dữ liệu 2 chiều có ba nhóm: 300 điểm N(tâm (0, 0), σ = 3), 30 điểm N(tâm (8, 0), σ = 0.5) và 30 điểm N(tâm (11, 0), σ = 0.5). Chạy `KMeans(n_clusters=3, n_init=10)`. Kết quả nào xảy ra?",
    options: [
      { content: "Ra gần đúng ba nhóm, chỉ lệch biên: vài chục điểm ở rìa phải của cụm lớn bị gán sang nhóm (8, 0)" },
      { content: "Cụm lớn bị chia hai, hai nhóm nhỏ bị gộp một; cách chia này có inertia thấp hơn cách chia đúng ba nhóm", correct: true },
      { content: "Cụm lớn bị chia hai, hai nhóm nhỏ bị gộp một, vì thuật toán kẹt ở cực tiểu địa phương có inertia cao hơn cách chia đúng" },
      { content: "Ra đúng ba nhóm ban đầu, vì n_init = 10 đủ để tìm được phân cụm tối ưu toàn cục" },
    ],
  },
];
