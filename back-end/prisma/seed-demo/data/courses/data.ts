import type { SeedCourse } from '../types.ts';

const PY_STARTER = (todo: string) => `import sys


def main():
    data = sys.stdin.read()
    # ${todo}


if __name__ == "__main__":
    main()
`;

const REVENUE_SOLUTION = `import sys
import csv


def main():
    lines = sys.stdin.read().strip().splitlines()
    revenue = {}
    for row in csv.DictReader(lines):
        if row["status"].strip() != "completed":
            continue
        quantity = row["quantity"].strip()
        unit_price = row["unit_price"].strip()
        if not quantity or not unit_price:
            continue
        category = row["category"].strip()
        revenue[category] = revenue.get(category, 0) + int(quantity) * int(unit_price)
    if not revenue:
        print("EMPTY")
        return
    for category, total in sorted(revenue.items(), key=lambda item: (-item[1], item[0])):
        print(f"{category},{total}")


if __name__ == "__main__":
    main()
`;

const REGRESSION_SOLUTION = `import sys


def main():
    tokens = sys.stdin.read().split()
    n = int(tokens[0])
    xs = [float(tokens[1 + 2 * i]) for i in range(n)]
    ys = [float(tokens[2 + 2 * i]) for i in range(n)]
    x_new = float(tokens[1 + 2 * n])
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    sxy = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    sxx = sum((x - mean_x) ** 2 for x in xs)
    a = sxy / sxx
    b = mean_y - a * mean_x
    print(f"a={a:.2f}")
    print(f"b={b:.2f}")
    print(f"y={a * x_new + b:.2f}")


if __name__ == "__main__":
    main()
`;

const EVENTS_SOLUTION = `import sys
import json


def parse(line):
    try:
        record = json.loads(line)
    except json.JSONDecodeError:
        return None
    if not isinstance(record, dict):
        return None
    event_id = record.get("event_id")
    user_id = record.get("user_id")
    amount = record.get("amount")
    ts = record.get("ts")
    if not isinstance(event_id, str) or not event_id:
        return None
    if not isinstance(user_id, str) or not user_id:
        return None
    if type(amount) is not int or amount < 0:
        return None
    if not isinstance(ts, str) or len(ts) < 10:
        return None
    return event_id, user_id, amount, ts[:10]


def main():
    seen = set()
    days = {}
    rejected = 0
    duplicates = 0
    for line in sys.stdin.read().splitlines():
        if not line.strip():
            continue
        parsed = parse(line)
        if parsed is None:
            rejected += 1
            continue
        event_id, user_id, amount, day = parsed
        if event_id in seen:
            duplicates += 1
            continue
        seen.add(event_id)
        stats = days.setdefault(day, {"events": 0, "users": set(), "amount": 0})
        stats["events"] += 1
        stats["users"].add(user_id)
        stats["amount"] += amount
    for day in sorted(days):
        stats = days[day]
        print(f"{day},{stats['events']},{len(stats['users'])},{stats['amount']}")
    print(f"rejected={rejected}")
    print(f"duplicates={duplicates}")


if __name__ == "__main__":
    main()
`;

export const COURSES: SeedCourse[] = [
  // D1
  {
    instructorEmail: 'ha.tran@skillpath.test',
    categorySlug: 'data-science',
    topics: [{ slug: 'sql', primary: true }, { slug: 'data-analysis' }, { slug: 'postgresql' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 0,
    status: 'published',
    title: 'SQL cho phân tích dữ liệu',
    subtitle: 'Tự viết truy vấn SQL để trả lời câu hỏi kinh doanh, từ lọc dữ liệu đến cohort và window function',
    description:
      'Bạn làm báo cáo mỗi tuần nhưng lần nào cũng phải nhờ team kỹ thuật xuất dữ liệu ra Excel rồi ngồi lọc tay? Hoặc bạn đã biết SELECT cơ bản nhưng gặp câu hỏi như "doanh thu tháng này so với tháng trước của từng khu vực" là không biết bắt đầu từ đâu? Khoá học này dành cho bạn. Mục tiêu là giúp bạn tự lấy được số liệu mình cần, đúng và nhanh, mà không phải chờ ai.\n\n' +
      'Toàn bộ khoá học xoay quanh một bộ dữ liệu bán hàng mô phỏng gồm khách hàng, đơn hàng, sản phẩm và khu vực, chạy trên PostgreSQL. Mỗi bài bắt đầu bằng một câu hỏi kinh doanh cụ thể, sau đó chúng ta cùng viết truy vấn từng bước, kiểm tra kết quả và bàn về những chỗ dễ sai. Bạn sẽ học:\n' +
      '• Lọc, sắp xếp và tổng hợp dữ liệu với WHERE, GROUP BY, HAVING\n' +
      '• Nối nhiều bảng bằng JOIN và nhận ra khi nào kết quả bị nhân dòng\n' +
      '• Viết truy vấn dài dễ đọc bằng CTE\n' +
      '• Xếp hạng, tính luỹ kế và so sánh kỳ trước bằng window function\n\n' +
      'Học xong, bạn có thể tự viết truy vấn cho các báo cáo thường gặp: top sản phẩm theo khu vực, doanh thu luỹ kế theo ngày, tỷ lệ khách quay lại theo cohort tháng. Quan trọng hơn, bạn sẽ có thói quen kiểm tra lại con số trước khi gửi đi, vì một JOIN sai có thể làm doanh thu tăng gấp đôi mà không ai để ý.\n\n' +
      'Khoá học không yêu cầu nền tảng lập trình. Mỗi chương có bài tập truy vấn trên chính bộ dữ liệu mẫu và lời giải chi tiết, kèm giải thích vì sao viết như vậy chứ không chỉ đưa đáp án. Điểm khác của khoá là tập trung vào tư duy phân tích: biến câu hỏi mơ hồ của sếp thành truy vấn rõ ràng, thay vì học thuộc cú pháp.',
    learningObjectives: [
      'Viết truy vấn SELECT có lọc, sắp xếp và tổng hợp để trả lời câu hỏi kinh doanh cụ thể',
      'Nối nhiều bảng bằng INNER JOIN, LEFT JOIN và phát hiện lỗi nhân dòng khi JOIN',
      'Tách truy vấn phức tạp thành các bước dễ kiểm tra bằng CTE',
      'Dùng ROW_NUMBER, RANK, SUM OVER và LAG để xếp hạng, tính luỹ kế và so sánh kỳ trước',
      'Xây bảng cohort theo tháng để đo tỷ lệ khách hàng quay lại mua',
    ],
    requirements: [
      'Biết dùng máy tính và bảng tính ở mức cơ bản, không cần biết lập trình',
      'Máy tính cài được PostgreSQL (Windows, macOS hoặc Linux)',
    ],
    targetAudience: [
      'Nhân viên kinh doanh, marketing, vận hành muốn tự lấy số liệu làm báo cáo',
      'Sinh viên muốn bắt đầu con đường Data Analyst',
    ],
    thumbnail: { label: 'SQL', tagline: 'Truy vấn để ra quyết định' },
    sections: [
      {
        title: 'Bắt đầu với SQL và PostgreSQL',
        lectures: ['Giới thiệu khoá học và bộ dữ liệu bán hàng mẫu', 'Cài PostgreSQL, DBeaver và nạp dữ liệu mẫu'],
      },
      {
        title: 'Truy vấn và tổng hợp dữ liệu',
        lectures: [
          'SELECT, WHERE và ORDER BY: lọc đúng dữ liệu cần xem',
          'GROUP BY, HAVING và các hàm COUNT, SUM, AVG',
          'JOIN nhiều bảng: INNER, LEFT và bẫy nhân dòng',
        ],
      },
      {
        title: 'Phân tích nâng cao',
        lectures: [
          'CTE với WITH: chia nhỏ truy vấn dài',
          'Window function: ROW_NUMBER, RANK và PARTITION BY',
          'Phân tích cohort và tỷ lệ giữ chân khách hàng',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: SQL cho phân tích',
      description: 'Ôn lại tổng hợp, JOIN, window function và cách dựng cohort.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Điểm khác nhau chính giữa WHERE và HAVING là gì?',
          relatedLecture: 3,
          options: [
            {
              content: 'WHERE lọc từng dòng trước khi gom nhóm, HAVING lọc các nhóm sau khi đã tổng hợp',
              correct: true,
              explanation: 'Đúng. Vì vậy điều kiện trên SUM(), COUNT() phải đặt ở HAVING, còn điều kiện trên cột thường nên đặt ở WHERE.',
            },
            {
              content: 'HAVING chạy trước WHERE nên nhanh hơn',
              explanation: 'Sai. Thứ tự xử lý logic là FROM, WHERE, GROUP BY rồi mới đến HAVING.',
            },
            {
              content: 'Hai mệnh đề giống nhau, chỉ khác tên gọi',
              explanation: 'Sai. WHERE không dùng được hàm tổng hợp như SUM(amount) > 1000000, còn HAVING thì được.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Bạn viết customers LEFT JOIN orders. Khách hàng chưa có đơn nào sẽ xuất hiện thế nào trong kết quả?',
          relatedLecture: 4,
          options: [
            {
              content: 'Vẫn có một dòng, các cột lấy từ orders mang giá trị NULL',
              correct: true,
              explanation: 'Đúng. LEFT JOIN giữ mọi dòng của bảng bên trái, phần không khớp ở bảng bên phải được điền NULL.',
            },
            {
              content: 'Bị loại khỏi kết quả',
              explanation: 'Sai. Đó là hành vi của INNER JOIN, chỉ giữ các dòng khớp ở cả hai bảng.',
            },
            {
              content: 'Truy vấn báo lỗi vì thiếu khoá ngoại',
              explanation: 'Sai. JOIN không yêu cầu có khoá ngoại, chỉ cần điều kiện ON hợp lệ.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Trong cùng một PARTITION, hai sản phẩm có doanh thu bằng nhau. Những phát biểu nào đúng?',
          relatedLecture: 6,
          options: [
            {
              content: 'ROW_NUMBER() gán cho hai dòng hai số thứ tự khác nhau',
              correct: true,
              explanation: 'Đúng. ROW_NUMBER luôn đánh số liên tục và không trùng; thứ tự giữa hai dòng bằng nhau không xác định, muốn ổn định phải thêm khoá phụ vào ORDER BY.',
            },
            {
              content: 'RANK() gán cho hai dòng cùng một hạng',
              correct: true,
              explanation: 'Đúng. RANK cho các giá trị bằng nhau cùng hạng, ví dụ cả hai cùng hạng 2.',
            },
            {
              content: 'RANK() không bỏ qua hạng nào sau hai dòng bằng nhau',
              explanation: 'Sai. RANK sẽ nhảy hạng (1, 2, 2, 4). Hàm không nhảy hạng là DENSE_RANK (1, 2, 2, 3).',
            },
            {
              content: 'Window function làm giảm số dòng của kết quả giống GROUP BY',
              explanation: 'Sai. Window function giữ nguyên số dòng, chỉ thêm cột tính toán trên "cửa sổ" các dòng liên quan.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Bảng orders có 100 dòng, trong đó 8 dòng có coupon_code là NULL. COUNT(coupon_code) trả về bao nhiêu?',
          relatedLecture: 3,
          options: [
            {
              content: '92',
              correct: true,
              explanation: 'Đúng. COUNT(cột) chỉ đếm các giá trị khác NULL.',
            },
            {
              content: '100',
              explanation: 'Sai. Đó là kết quả của COUNT(*), đếm mọi dòng bất kể giá trị NULL.',
            },
            {
              content: '8',
              explanation: 'Sai. 8 là số dòng NULL. Muốn đếm chúng phải dùng COUNT(*) FILTER (WHERE coupon_code IS NULL) hoặc SUM với CASE.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Khi phân tích cohort theo tháng, một khách hàng được xếp vào cohort dựa trên tiêu chí nào?',
          relatedLecture: 7,
          options: [
            {
              content: 'Tháng phát sinh đơn hàng đầu tiên của khách hàng',
              correct: true,
              explanation: 'Đúng. Cohort gom những khách bắt đầu cùng thời điểm, sau đó theo dõi họ quay lại ở các tháng tiếp theo.',
            },
            {
              content: 'Tháng có đơn hàng giá trị lớn nhất',
              explanation: 'Sai. Tiêu chí này thay đổi theo thời gian nên không dùng để so sánh tỷ lệ giữ chân được.',
            },
            {
              content: 'Tháng gần nhất khách hàng mua',
              explanation: 'Sai. Dùng lần mua gần nhất thì mọi khách đều "mới", không đo được việc quay lại.',
            },
          ],
        },
      ],
    },
  },

  // D2
  {
    instructorEmail: 'ha.tran@skillpath.test',
    categorySlug: 'data-science',
    topics: [{ slug: 'pandas', primary: true }, { slug: 'python' }, { slug: 'data-analysis' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 799_000,
    status: 'published',
    title: 'Phân tích dữ liệu với Python & Pandas',
    subtitle: 'Làm sạch, biến đổi và tổng hợp dữ liệu thật bằng pandas để tự làm báo cáo doanh thu hoàn chỉnh',
    description:
      'Excel rất tiện cho đến khi file vượt vài trăm nghìn dòng, công thức chạy chậm và mỗi tháng bạn phải lặp lại đúng chuỗi thao tác cũ. Pandas giải quyết chính vấn đề đó: bạn viết các bước xử lý một lần bằng Python, lần sau chỉ cần chạy lại với dữ liệu mới. Khoá học này dẫn bạn từ những dòng code Python đầu tiên đến một báo cáo doanh thu tự động.\n\n' +
      'Chúng ta làm việc với bộ dữ liệu đơn hàng của một cửa hàng thương mại điện tử mô phỏng, có đủ những vấn đề của dữ liệu thật: ô trống, đơn trùng, ngày tháng sai định dạng, giá lưu dạng chuỗi. Các chương đi theo đúng quy trình một nhà phân tích làm hằng ngày:\n' +
      '• Đọc dữ liệu và xem nhanh cấu trúc bằng DataFrame\n' +
      '• Làm sạch: xử lý giá trị thiếu, bản ghi trùng và sai kiểu dữ liệu\n' +
      '• Biến đổi và tổng hợp bằng groupby, merge, pivot_table\n' +
      '• Xử lý chuỗi thời gian và vẽ biểu đồ bằng Matplotlib\n\n' +
      'Học xong, bạn tự làm được báo cáo doanh thu theo danh mục, theo tháng, theo nhóm khách hàng; biết ghép dữ liệu từ nhiều file; và biết đặt câu hỏi kiểm tra như "tổng sau khi merge có khớp với tổng ban đầu không". Dự án cuối khoá là một notebook báo cáo hoàn chỉnh mà bạn có thể đưa vào portfolio.\n\n' +
      'Mỗi bài đều có notebook mẫu để chạy theo, cuối chương có bài tập trên dữ liệu khác với ví dụ để bạn tự luyện. Khoá còn có một bài code chạy trực tiếp trên nền tảng, giúp bạn luyện tư duy gom nhóm và làm sạch dữ liệu bằng Python thuần trước khi dùng pandas. Khoá học không giả định bạn biết Python trước, phần cú pháp cần thiết được giới thiệu ngay khi dùng tới.',
    learningObjectives: [
      'Đọc dữ liệu CSV, Excel vào DataFrame và nhanh chóng nắm cấu trúc bằng info, describe, value_counts',
      'Làm sạch dữ liệu: xử lý giá trị thiếu, loại bản ghi trùng và chuyển đúng kiểu dữ liệu',
      'Tổng hợp doanh thu theo nhiều chiều bằng groupby, agg và pivot_table',
      'Ghép dữ liệu từ nhiều nguồn bằng merge, concat và kiểm tra kết quả sau khi ghép',
      'Xử lý dữ liệu theo thời gian với to_datetime, resample và vẽ biểu đồ bằng Matplotlib',
    ],
    requirements: [
      'Biết dùng máy tính cơ bản, chưa cần biết Python',
      'Máy tính cài được Python 3 và Jupyter Notebook',
    ],
    targetAudience: [
      'Người làm báo cáo bằng Excel muốn tự động hoá công việc lặp lại',
      'Sinh viên kinh tế, kỹ thuật muốn theo hướng Data Analyst',
    ],
    thumbnail: { label: 'Pandas', tagline: 'Từ dữ liệu thô đến báo cáo' },
    sections: [
      {
        title: 'Chuẩn bị môi trường',
        lectures: [
          'Giới thiệu khoá học và bộ dữ liệu đơn hàng thương mại điện tử',
          'Cài Python, Jupyter Notebook và pandas',
        ],
      },
      {
        title: 'Làm quen với DataFrame',
        lectures: [
          'Series và DataFrame: đọc CSV và xem nhanh dữ liệu',
          'Lọc dòng với loc, iloc và điều kiện boolean',
          'Làm sạch dữ liệu: giá trị thiếu, trùng lặp và sai kiểu',
        ],
      },
      {
        title: 'Biến đổi và tổng hợp',
        lectures: [
          'groupby và agg: doanh thu theo danh mục, theo tháng',
          'merge và concat: ghép dữ liệu từ nhiều nguồn',
          'pivot_table và dữ liệu thời gian với to_datetime, resample',
        ],
      },
      {
        title: 'Trực quan hoá và báo cáo',
        lectures: [
          'Vẽ biểu đồ với Matplotlib từ kết quả pandas',
          'Dự án cuối khoá: notebook báo cáo doanh thu hoàn chỉnh',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: Pandas căn bản',
      description: 'Ôn lại cách chọn dữ liệu, làm sạch, tổng hợp và ghép bảng trong pandas.',
      questions: [
        {
          type: 'single_choice',
          stem: 'DataFrame df có index mặc định từ 0 đến 9. Lệnh df.loc[0:2] trả về bao nhiêu dòng?',
          relatedLecture: 3,
          options: [
            {
              content: '3 dòng',
              correct: true,
              explanation: 'Đúng. loc chọn theo nhãn và lấy cả nhãn cuối, nên gồm các dòng 0, 1, 2.',
            },
            {
              content: '2 dòng',
              explanation: 'Sai. Đó là kết quả của df.iloc[0:2], vì iloc chọn theo vị trí và không lấy vị trí cuối giống slicing của Python.',
            },
            {
              content: 'Báo lỗi vì loc không hỗ trợ slicing',
              explanation: 'Sai. loc hỗ trợ slicing theo nhãn, miễn là nhãn tồn tại trong index.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Gọi df.dropna() mà không truyền tham số nào thì điều gì xảy ra?',
          relatedLecture: 4,
          options: [
            {
              content: 'Trả về DataFrame mới đã bỏ mọi dòng có ít nhất một giá trị thiếu',
              correct: true,
              explanation: 'Đúng. Mặc định how="any" và axis=0. Cần cẩn thận vì có thể mất nhiều dòng chỉ do một cột phụ bị trống.',
            },
            {
              content: 'Xoá trực tiếp các dòng thiếu trong df ban đầu',
              explanation: 'Sai. Mặc định dropna trả về đối tượng mới, df gốc giữ nguyên nếu bạn không gán lại.',
            },
            {
              content: 'Bỏ các cột có giá trị thiếu',
              explanation: 'Sai. Muốn bỏ cột phải truyền axis=1 hoặc axis="columns".',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những cách nào cho ra tổng doanh thu theo từng danh mục (cột category, revenue)?',
          relatedLecture: 5,
          options: [
            {
              content: "df.groupby('category')['revenue'].sum()",
              correct: true,
              explanation: 'Đúng. Đây là cách phổ biến nhất: gom nhóm theo category rồi cộng revenue trong mỗi nhóm.',
            },
            {
              content: "df.pivot_table(index='category', values='revenue', aggfunc='sum')",
              correct: true,
              explanation: 'Đúng. pivot_table cho cùng kết quả, dưới dạng DataFrame, và tiện khi cần thêm chiều cột.',
            },
            {
              content: "df.sort_values('category')['revenue'].sum()",
              explanation: 'Sai. Sắp xếp không gom nhóm, lệnh này chỉ trả về một con số là tổng toàn bộ.',
            },
            {
              content: "df['category'].value_counts()",
              explanation: 'Sai. value_counts đếm số dòng của mỗi danh mục chứ không cộng doanh thu.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: "orders.merge(customers, on='customer_id', how='left') cho kết quả thế nào với đơn có customer_id không tồn tại trong customers?",
          relatedLecture: 6,
          options: [
            {
              content: 'Đơn vẫn được giữ, các cột lấy từ customers là NaN',
              correct: true,
              explanation: 'Đúng. how="left" giữ mọi dòng của bảng bên trái. Nên đếm số NaN sau merge để phát hiện dữ liệu mồ côi.',
            },
            {
              content: 'Đơn bị loại khỏi kết quả',
              explanation: 'Sai. Đó là hành vi của how="inner", mặc định của merge.',
            },
            {
              content: 'Pandas báo lỗi KeyError',
              explanation: 'Sai. merge không báo lỗi khi không khớp, nó chỉ điền giá trị thiếu.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: "Cột order_date đang là chuỗi dạng '2024-03-15'. Muốn tính doanh thu theo tháng bằng resample, cần làm gì trước?",
          relatedLecture: 7,
          options: [
            {
              content: 'Chuyển cột sang datetime bằng pd.to_datetime và đặt làm index',
              correct: true,
              explanation: 'Đúng. resample chỉ hoạt động trên DatetimeIndex (hoặc qua tham số on với cột datetime).',
            },
            {
              content: 'Sắp xếp cột theo thứ tự chữ cái',
              explanation: 'Sai. Sắp xếp chuỗi không biến nó thành kiểu thời gian, resample vẫn báo lỗi.',
            },
            {
              content: 'Không cần làm gì, pandas tự nhận ra chuỗi ngày tháng',
              explanation: 'Sai. read_csv chỉ tự chuyển khi bạn truyền parse_dates, còn không thì cột vẫn là kiểu object.',
            },
          ],
        },
      ],
    },
    exercise: {
      title: 'Doanh thu theo danh mục từ file đơn hàng',
      learningObjective: 'Làm sạch dữ liệu đơn hàng và gom nhóm để tính doanh thu theo danh mục bằng Python thuần',
      instructions:
        'Đầu vào là nội dung một file CSV đọc từ stdin. Dòng đầu là header: order_id,category,quantity,unit_price,status. Mỗi dòng sau là một đơn hàng, quantity và unit_price là số nguyên nhưng có thể bị trống.\n\n' +
        'Yêu cầu:\n' +
        '• Chỉ tính các đơn có status là completed.\n' +
        '• Bỏ qua đơn có quantity hoặc unit_price trống.\n' +
        '• Doanh thu của một đơn là quantity × unit_price.\n\n' +
        'In mỗi danh mục một dòng theo dạng <category>,<doanh thu>, sắp xếp theo doanh thu giảm dần; nếu bằng nhau thì theo tên danh mục tăng dần. Nếu không có đơn hợp lệ nào thì in EMPTY.\n\n' +
        'Ví dụ input:\n' +
        'order_id,category,quantity,unit_price,status\n' +
        '1,sach,2,120000,completed\n' +
        '2,dien-tu,1,2500000,completed\n' +
        '3,sach,1,85000,cancelled\n\n' +
        'Output:\n' +
        'dien-tu,2500000\n' +
        'sach,240000',
      hints: [
        'Module csv có DictReader giúp đọc mỗi dòng thành dict theo header',
        'Dùng dict để cộng dồn doanh thu theo danh mục, giống groupby().sum() trong pandas',
        'sorted với key=lambda item: (-item[1], item[0]) sắp xếp doanh thu giảm dần rồi tên tăng dần',
      ],
      solutionExplanation:
        'Đọc toàn bộ stdin, đưa vào csv.DictReader. Với mỗi dòng, bỏ qua nếu status khác completed hoặc thiếu quantity, unit_price; còn lại cộng quantity × unit_price vào dict theo category. Cuối cùng sắp xếp các cặp (danh mục, doanh thu) theo khoá (-doanh thu, tên) và in ra. Đây chính là logic của df[mask].groupby("category")["revenue"].sum().sort_values() trong pandas, viết bằng Python thuần.',
      difficulty: 'easy',
      relatedLecture: 5,
      code: [
        {
          language: 'python',
          starter: PY_STARTER('Đọc CSV, lọc đơn completed hợp lệ, tính doanh thu theo category rồi in kết quả'),
          solution: REVENUE_SOLUTION,
        },
      ],
      tests: [
        {
          input:
            'order_id,category,quantity,unit_price,status\n1,sach,2,120000,completed\n2,dien-tu,1,2500000,completed\n3,sach,1,85000,cancelled\n4,thoi-trang,3,150000,completed\n5,sach,4,90000,completed\n',
          expectedOutput: 'dien-tu,2500000\nsach,600000\nthoi-trang,450000',
          isPublic: true,
        },
        {
          input:
            'order_id,category,quantity,unit_price,status\n1,my-pham,2,180000,completed\n2,my-pham,,180000,completed\n3,do-gia-dung,1,,completed\n4,do-gia-dung,2,350000,completed\n5,my-pham,1,180000,pending\n',
          expectedOutput: 'do-gia-dung,700000\nmy-pham,360000',
          isPublic: true,
        },
        {
          input:
            'order_id,category,quantity,unit_price,status\n1,the-thao,2,250000,completed\n2,sach,5,100000,completed\n3,do-choi,1,500000,completed\n4,sach,1,40000,refunded\n',
          expectedOutput: 'do-choi,500000\nsach,500000\nthe-thao,500000',
          isPublic: false,
        },
        {
          input: 'order_id,category,quantity,unit_price,status\n1,sach,1,90000,cancelled\n2,dien-tu,1,,completed\n',
          expectedOutput: 'EMPTY',
          isPublic: false,
        },
      ],
    },
  },

  // D3
  {
    instructorEmail: 'ha.tran@skillpath.test',
    categorySlug: 'databases',
    topics: [{ slug: 'mysql', primary: true }, { slug: 'sql' }],
    language: 'vi',
    level: 'intermediate',
    priceAmount: 0,
    status: 'published',
    title: 'MySQL: thiết kế lược đồ và tối ưu truy vấn',
    subtitle: 'Thiết kế lược đồ MySQL đúng ngay từ đầu, đọc EXPLAIN và đặt index để truy vấn chậm chạy nhanh trở lại',
    description:
      'Ứng dụng chạy mượt lúc mới ra mắt, nhưng vài tháng sau bảng đơn hàng lên hàng triệu dòng, trang danh sách mất vài giây mới tải và thỉnh thoảng còn gặp deadlock. Phần lớn những vấn đề này bắt nguồn từ hai chỗ: lược đồ thiết kế vội và index đặt theo cảm tính. Khoá học này giúp bạn xử lý tận gốc cả hai.\n\n' +
      'Chúng ta xây cơ sở dữ liệu cho một hệ thống đặt vé xe khách, từ thiết kế bảng đến khi dữ liệu đủ lớn để thấy rõ khác biệt khi tối ưu. Nội dung chính:\n' +
      '• Chuẩn hoá lược đồ và biết khi nào nên phi chuẩn hoá có chủ đích\n' +
      '• Chọn kiểu dữ liệu, charset utf8mb4 và ràng buộc phù hợp với InnoDB\n' +
      '• Hiểu clustered index, secondary index và cách InnoDB tìm dữ liệu\n' +
      '• Đọc EXPLAIN, đặt composite index đúng thứ tự cột\n' +
      '• Bật slow query log, viết lại truy vấn chậm và xử lý deadlock\n\n' +
      'Học xong, bạn có thể nhìn vào một truy vấn chậm, chạy EXPLAIN, chỉ ra vì sao MySQL đang quét toàn bảng và đưa ra cách sửa cụ thể: thêm index, đổi thứ tự cột trong index, hay viết lại điều kiện để không bọc hàm quanh cột. Bạn cũng hiểu các mức cô lập giao dịch đủ để giải thích vì sao hai request đồng thời lại khoá nhau.\n\n' +
      'Mỗi bài tối ưu đều đo thời gian trước và sau trên cùng bộ dữ liệu sinh sẵn, để bạn thấy hiệu quả bằng số liệu thay vì tin theo lời khuyên chung chung. Khoá phù hợp với lập trình viên backend đã dùng MySQL qua ORM và muốn hiểu chuyện gì thực sự diễn ra bên dưới.',
    learningObjectives: [
      'Thiết kế lược đồ đạt chuẩn 3NF và phi chuẩn hoá có chủ đích khi cần tốc độ đọc',
      'Chọn kiểu dữ liệu, charset utf8mb4 và ràng buộc khoá ngoại phù hợp cho bảng InnoDB',
      'Đọc kết quả EXPLAIN để nhận ra full table scan, filesort và index không được dùng',
      'Thiết kế composite index theo quy tắc tiền tố bên trái cho các truy vấn thường gặp',
      'Phân tích slow query log và viết lại truy vấn chậm để tận dụng index',
      'Giải thích các mức cô lập giao dịch và xử lý deadlock trong InnoDB',
    ],
    requirements: [
      'Viết được truy vấn SQL cơ bản: SELECT, JOIN, GROUP BY',
      'Đã từng làm việc với một ứng dụng có dùng cơ sở dữ liệu quan hệ',
    ],
    targetAudience: [
      'Lập trình viên backend dùng MySQL muốn hết cảnh truy vấn chậm',
      'Sinh viên năm cuối chuẩn bị đi làm ở vị trí backend',
    ],
    thumbnail: { label: 'MySQL', tagline: 'Index đúng, truy vấn nhanh' },
    sections: [
      {
        title: 'Khởi động',
        lectures: [
          'Giới thiệu khoá học và bài toán hệ thống đặt vé xe khách',
          'Chạy MySQL 8 bằng Docker và làm quen MySQL Workbench',
        ],
      },
      {
        title: 'Thiết kế lược đồ',
        lectures: [
          'Chuẩn hoá 1NF, 2NF, 3NF và khi nào nên phi chuẩn hoá',
          'Chọn kiểu dữ liệu: INT, DECIMAL, VARCHAR, DATETIME và utf8mb4',
          'Khoá ngoại, ràng buộc và đặc điểm của InnoDB',
        ],
      },
      {
        title: 'Index và EXPLAIN',
        lectures: [
          'B-Tree index trong InnoDB: clustered và secondary index',
          'Đọc EXPLAIN: type, key, rows và Extra',
          'Composite index và quy tắc tiền tố bên trái',
        ],
      },
      {
        title: 'Truy vấn chậm và giao dịch',
        lectures: [
          'Bật slow query log và viết lại truy vấn chậm',
          'Transaction, mức cô lập và deadlock trong InnoDB',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: lược đồ và index MySQL',
      description: 'Ôn lại kiểu dữ liệu, cách đọc EXPLAIN, composite index và giao dịch trong InnoDB.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Bảng có index (route_id, depart_date, status). Truy vấn nào dưới đây KHÔNG tận dụng được index này để tìm dòng?',
          relatedLecture: 7,
          options: [
            {
              content: "WHERE depart_date = '2024-08-01' AND status = 'paid'",
              correct: true,
              explanation: 'Đúng. Thiếu cột đầu tiên route_id nên không thoả quy tắc tiền tố bên trái, MySQL không thể dùng index để thu hẹp phạm vi tìm.',
            },
            {
              content: 'WHERE route_id = 12',
              explanation: 'Sai. route_id là cột đầu tiên của index nên dùng được.',
            },
            {
              content: "WHERE route_id = 12 AND depart_date = '2024-08-01'",
              explanation: 'Sai. Hai cột đầu tiên theo đúng thứ tự, index được dùng rất hiệu quả.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Trong kết quả EXPLAIN, cột type có giá trị ALL nghĩa là gì?',
          relatedLecture: 6,
          options: [
            {
              content: 'MySQL quét toàn bộ bảng để tìm dòng phù hợp',
              correct: true,
              explanation: 'Đúng. type = ALL là full table scan, thường là dấu hiệu thiếu index hoặc index không dùng được.',
            },
            {
              content: 'Truy vấn dùng tất cả index có trên bảng',
              explanation: 'Sai. Index được chọn hiển thị ở cột key, và thường chỉ một index được dùng cho mỗi bảng.',
            },
            {
              content: 'Truy vấn trả về tất cả các cột',
              explanation: 'Sai. type mô tả cách truy cập dòng, không liên quan đến số cột trong SELECT.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Cột created_at có index. Những điều kiện nào khiến MySQL không dùng được index đó?',
          relatedLecture: 8,
          options: [
            {
              content: "WHERE DATE(created_at) = '2024-05-01'",
              correct: true,
              explanation: 'Đúng. Bọc hàm quanh cột khiến MySQL phải tính lại cho từng dòng, index trên giá trị gốc không dùng được.',
            },
            {
              content: 'WHERE YEAR(created_at) = 2024',
              correct: true,
              explanation: 'Đúng. Cùng lý do với DATE(). Nên viết lại thành một khoảng giá trị trên chính cột created_at.',
            },
            {
              content: "WHERE created_at >= '2024-05-01' AND created_at < '2024-05-02'",
              explanation: 'Sai. Đây là range scan trên cột gốc, index được dùng tốt. Đây cũng là cách viết lại đúng cho DATE(created_at).',
            },
            {
              content: 'ORDER BY created_at DESC LIMIT 20',
              explanation: 'Sai. MySQL có thể đọc index theo chiều ngược và dừng sau 20 dòng, không cần filesort.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Người dùng nhập tên có emoji nhưng MySQL báo lỗi "Incorrect string value". Nguyên nhân thường gặp nhất là gì?',
          relatedLecture: 3,
          options: [
            {
              content: 'Bảng dùng charset utf8 (utf8mb3), chỉ lưu tối đa 3 byte mỗi ký tự',
              correct: true,
              explanation: 'Đúng. Emoji cần 4 byte. Dùng utf8mb4 cho cả bảng, cột và kết nối là cách xử lý chuẩn.',
            },
            {
              content: 'Cột VARCHAR quá ngắn',
              explanation: 'Sai. Cột quá ngắn sẽ báo lỗi "Data too long", không phải "Incorrect string value".',
            },
            {
              content: 'MySQL không hỗ trợ lưu emoji',
              explanation: 'Sai. MySQL lưu emoji bình thường với charset utf8mb4.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Mức cô lập giao dịch mặc định của InnoDB là gì?',
          relatedLecture: 9,
          options: [
            {
              content: 'REPEATABLE READ',
              correct: true,
              explanation: 'Đúng. InnoDB mặc định REPEATABLE READ và dùng gap lock để hạn chế phantom read.',
            },
            {
              content: 'READ COMMITTED',
              explanation: 'Sai. Đây là mức mặc định của nhiều hệ quản trị khác như PostgreSQL, nhưng không phải của InnoDB.',
            },
            {
              content: 'SERIALIZABLE',
              explanation: 'Sai. SERIALIZABLE chặt nhất nhưng giảm khả năng chạy đồng thời, phải bật thủ công.',
            },
          ],
        },
      ],
    },
  },

  // D4
  {
    instructorEmail: 'ha.tran@skillpath.test',
    categorySlug: 'data-science',
    topics: [{ slug: 'data-science', primary: true }, { slug: 'python' }, { slug: 'machine-learning' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 0,
    status: 'published',
    title: 'Khoa học dữ liệu nhập môn với Python',
    subtitle: 'Hiểu quy trình khoa học dữ liệu và tự xây mô hình học máy đầu tiên bằng Python và scikit-learn',
    description:
      'Khoa học dữ liệu nghe có vẻ đáng sợ với toàn thuật ngữ thống kê và mô hình, nhưng phần cốt lõi lại khá gần gũi: đặt đúng câu hỏi, hiểu dữ liệu đang nói gì, rồi dùng mô hình đơn giản để dự đoán và kiểm tra xem dự đoán có đáng tin không. Khoá học này đi qua đúng quy trình đó, chậm rãi và có ví dụ cho từng khái niệm.\n\n' +
      'Bạn bắt đầu với thống kê mô tả để hiểu vì sao trung vị đôi khi phản ánh dữ liệu tốt hơn trung bình, học cách khám phá dữ liệu bằng biểu đồ và nhận ra tương quan không đồng nghĩa với nhân quả. Sau đó chúng ta xây những mô hình học máy đầu tiên:\n' +
      '• Hồi quy tuyến tính dự đoán giá nhà theo diện tích\n' +
      '• Chia train/test và đánh giá mô hình bằng MAE, RMSE\n' +
      '• Phân loại với k-NN và cây quyết định trong scikit-learn\n' +
      '• Nhận biết overfitting, underfitting qua learning curve\n\n' +
      'Học xong, bạn hiểu một dự án khoa học dữ liệu gồm những bước nào, tự làm được phân tích khám phá trên một bộ dữ liệu mới, huấn luyện và đánh giá được mô hình cơ bản, và quan trọng nhất là biết đặt câu hỏi phản biện khi thấy một con số độ chính xác quá đẹp.\n\n' +
      'Mỗi khái niệm toán học đều được giải thích bằng trực giác và hình vẽ trước khi viết công thức. Khoá có bài code chạy trực tiếp trên nền tảng: bạn tự cài đặt hồi quy tuyến tính bằng Python thuần để hiểu thư viện thực sự làm gì bên trong, trước khi gọi scikit-learn. Đây là bước đệm tốt trước khi học sâu hơn về Machine Learning.',
    learningObjectives: [
      'Mô tả các bước của một dự án khoa học dữ liệu từ đặt câu hỏi đến đánh giá mô hình',
      'Tính và diễn giải trung bình, trung vị, độ lệch chuẩn và hệ số tương quan',
      'Thực hiện phân tích khám phá dữ liệu với pandas và biểu đồ trên một bộ dữ liệu mới',
      'Huấn luyện mô hình hồi quy tuyến tính và đánh giá bằng MAE, RMSE trên tập test',
      'Xây mô hình phân loại k-NN, cây quyết định và nhận biết overfitting qua learning curve',
    ],
    requirements: [
      'Biết Python cơ bản: biến, vòng lặp, hàm và list',
      'Kiến thức toán phổ thông, không cần học lại đại số tuyến tính',
    ],
    targetAudience: [
      'Sinh viên CNTT, kinh tế muốn tìm hiểu ngành khoa học dữ liệu',
      'Lập trình viên muốn có nền tảng trước khi học Machine Learning chuyên sâu',
    ],
    thumbnail: { label: 'Data Science', tagline: 'Bước đầu với dữ liệu' },
    sections: [
      {
        title: 'Khoa học dữ liệu là gì',
        lectures: [
          'Giới thiệu khoá học: quy trình một dự án khoa học dữ liệu',
          'Cài Anaconda và làm quen Jupyter Notebook',
        ],
      },
      {
        title: 'Hiểu dữ liệu bằng thống kê',
        lectures: [
          'Thống kê mô tả: trung bình, trung vị, độ lệch chuẩn',
          'Khám phá dữ liệu (EDA) với pandas và biểu đồ',
          'Tương quan không phải nhân quả: đọc hệ số tương quan',
        ],
      },
      {
        title: 'Mô hình học máy đầu tiên',
        lectures: [
          'Hồi quy tuyến tính: dự đoán giá nhà từ diện tích',
          'Chia train/test và đánh giá bằng MAE, RMSE',
          'Phân loại với k-NN và cây quyết định trong scikit-learn',
          'Overfitting, underfitting và cách đọc learning curve',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: nhập môn khoa học dữ liệu',
      description: 'Ôn lại thống kê mô tả, tương quan và cách đánh giá mô hình học máy.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Lương của 9 nhân viên khoảng 15 triệu, riêng giám đốc 300 triệu. Chỉ số nào phản ánh mức lương điển hình tốt hơn?',
          relatedLecture: 2,
          options: [
            {
              content: 'Trung vị',
              correct: true,
              explanation: 'Đúng. Trung vị là giá trị ở giữa sau khi sắp xếp nên ít bị ảnh hưởng bởi một giá trị ngoại lai.',
            },
            {
              content: 'Trung bình',
              explanation: 'Sai. Một mức lương 300 triệu kéo trung bình lên gần 44 triệu, không đại diện cho đa số.',
            },
            {
              content: 'Độ lệch chuẩn',
              explanation: 'Sai. Độ lệch chuẩn đo mức độ phân tán, không cho biết giá trị điển hình.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Doanh số kem và số vụ đuối nước có hệ số tương quan 0,9. Kết luận nào hợp lý?',
          relatedLecture: 4,
          options: [
            {
              content: 'Hai đại lượng cùng tăng giảm, có thể do một yếu tố chung như thời tiết nóng',
              correct: true,
              explanation: 'Đúng. Tương quan cao chỉ cho biết hai biến đi cùng nhau. Biến gây nhiễu (nhiệt độ) giải thích cả hai.',
            },
            {
              content: 'Ăn kem làm tăng nguy cơ đuối nước',
              explanation: 'Sai. Đây là suy diễn nhân quả từ tương quan, lỗi kinh điển trong phân tích dữ liệu.',
            },
            {
              content: 'Hệ số 0,9 chứng minh hai biến không liên quan',
              explanation: 'Sai. 0,9 là tương quan dương rất mạnh, gần 0 mới là không có quan hệ tuyến tính.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Vì sao phải đánh giá mô hình trên tập test tách riêng thay vì trên chính dữ liệu huấn luyện?',
          relatedLecture: 6,
          options: [
            {
              content: 'Để đo khả năng dự đoán trên dữ liệu mô hình chưa từng thấy',
              correct: true,
              explanation: 'Đúng. Mô hình có thể "học thuộc" dữ liệu huấn luyện, chỉ tập test mới cho biết nó tổng quát hoá tốt đến đâu.',
            },
            {
              content: 'Để mô hình huấn luyện nhanh hơn',
              explanation: 'Sai. Tách tập test làm giảm dữ liệu huấn luyện, mục đích không phải tốc độ.',
            },
            {
              content: 'Vì scikit-learn bắt buộc phải có tập test',
              explanation: 'Sai. Thư viện không bắt buộc, đây là nguyên tắc phương pháp để tránh đánh giá quá lạc quan.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những dấu hiệu nào cho thấy mô hình đang bị overfitting?',
          relatedLecture: 8,
          options: [
            {
              content: 'Độ chính xác trên tập train 99% nhưng trên tập test chỉ 70%',
              correct: true,
              explanation: 'Đúng. Khoảng cách lớn giữa train và test là dấu hiệu điển hình của việc học thuộc dữ liệu huấn luyện.',
            },
            {
              content: 'Trên learning curve, đường train và validation cách xa nhau và không hội tụ',
              correct: true,
              explanation: 'Đúng. Khoảng hở lớn kéo dài cho thấy mô hình quá phức tạp so với lượng dữ liệu.',
            },
            {
              content: 'Độ chính xác trên cả tập train và test đều thấp',
              explanation: 'Sai. Đó là underfitting: mô hình quá đơn giản, chưa học được quy luật.',
            },
            {
              content: 'Độ chính xác trên tập test thấp hơn train khoảng 1%',
              explanation: 'Sai. Chênh lệch nhỏ như vậy là bình thường, mô hình đang tổng quát hoá tốt.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Vì sao nên chuẩn hoá thang đo các đặc trưng (ví dụ diện tích m² và số phòng) trước khi dùng k-NN?',
          relatedLecture: 7,
          options: [
            {
              content: 'Vì k-NN dựa trên khoảng cách, đặc trưng có thang đo lớn sẽ lấn át các đặc trưng khác',
              correct: true,
              explanation: 'Đúng. Diện tích chênh 50 đơn vị sẽ chi phối hoàn toàn khoảng cách so với số phòng chênh 1-2.',
            },
            {
              content: 'Vì k-NN chỉ nhận giá trị trong khoảng 0 đến 1',
              explanation: 'Sai. k-NN chạy được với mọi giá trị số, chỉ là kết quả bị lệch khi thang đo chênh nhau.',
            },
            {
              content: 'Vì chuẩn hoá giúp loại bỏ giá trị thiếu',
              explanation: 'Sai. Chuẩn hoá không xử lý giá trị thiếu, việc đó cần bước điền hoặc loại bỏ riêng.',
            },
          ],
        },
      ],
    },
    exercise: {
      title: 'Tự cài đặt hồi quy tuyến tính đơn biến',
      learningObjective: 'Tính hệ số hồi quy tuyến tính bằng phương pháp bình phương tối thiểu và dùng để dự đoán',
      instructions:
        'Cho n điểm dữ liệu (x, y), tìm đường thẳng y = a·x + b khớp nhất theo phương pháp bình phương tối thiểu:\n' +
        'a = Σ(x − x̄)(y − ȳ) / Σ(x − x̄)², b = ȳ − a·x̄\n\n' +
        'Input (stdin): dòng đầu là n (n ≥ 2). n dòng tiếp theo mỗi dòng gồm hai số x y. Dòng cuối là giá trị x_new cần dự đoán. Dữ liệu đảm bảo các x không bằng nhau hết.\n\n' +
        'Output: ba dòng a=<a>, b=<b>, y=<a·x_new + b>, mỗi số làm tròn 2 chữ số thập phân.\n\n' +
        'Ví dụ input:\n4\n1 3\n2 5\n3 7\n4 9\n10\n\n' +
        'Output:\na=2.00\nb=1.00\ny=21.00',
      hints: [
        'Đọc toàn bộ stdin rồi split() để lấy danh sách số, không cần quan tâm xuống dòng',
        'Tính trung bình x̄, ȳ trước, sau đó mới tính hai tổng ở tử số và mẫu số',
        'Dùng f"{value:.2f}" để in số với 2 chữ số thập phân',
      ],
      solutionExplanation:
        'Tách input thành các số, lấy n cặp (x, y) và x_new. Tính trung bình x̄, ȳ, sau đó tổng Σ(x − x̄)(y − ȳ) và Σ(x − x̄)². Hệ số góc a là thương hai tổng, hệ số chặn b = ȳ − a·x̄. Đây đúng là công thức mà LinearRegression của scikit-learn cho ra với một đặc trưng, chỉ khác là thư viện giải dạng ma trận cho nhiều đặc trưng.',
      difficulty: 'medium',
      relatedLecture: 5,
      code: [
        {
          language: 'python',
          starter: PY_STARTER('Đọc n điểm (x, y) và x_new, tính a, b rồi in a, b và giá trị dự đoán'),
          solution: REGRESSION_SOLUTION,
        },
      ],
      tests: [
        { input: '4\n1 3\n2 5\n3 7\n4 9\n10\n', expectedOutput: 'a=2.00\nb=1.00\ny=21.00', isPublic: true },
        {
          input: '5\n30 1250\n45 1800\n60 2350\n75 2900\n90 3600\n100\n',
          expectedOutput: 'a=38.67\nb=60.00\ny=3926.67',
          isPublic: true,
        },
        {
          input: '6\n2 52\n4 61\n5 63\n7 70\n8 76\n10 83\n6\n',
          expectedOutput: 'a=3.83\nb=44.50\ny=67.50',
          isPublic: false,
        },
        { input: '3\n-2 10\n0 6\n2 1\n1\n', expectedOutput: 'a=-2.25\nb=5.67\ny=3.42', isPublic: false },
      ],
    },
  },

  // D5
  {
    instructorEmail: 'bao.le@skillpath.test',
    categorySlug: 'databases',
    topics: [{ slug: 'postgresql', primary: true }, { slug: 'sql' }],
    language: 'vi',
    level: 'intermediate',
    priceAmount: 499_000,
    status: 'published',
    title: 'PostgreSQL cho Backend Developer',
    subtitle: 'Dùng PostgreSQL đúng cách trong ứng dụng backend: kiểu dữ liệu, index, transaction và hiệu năng',
    description:
      'Nhiều lập trình viên backend làm việc với PostgreSQL mỗi ngày nhưng chỉ qua ORM, nên khi API chậm hay dữ liệu bị ghi sai do hai request chạy cùng lúc thì không biết bắt đầu điều tra từ đâu. Khoá học này lấp khoảng trống đó: hiểu PostgreSQL đủ sâu để thiết kế bảng hợp lý, đọc được query plan và viết code an toàn khi có nhiều người dùng đồng thời.\n\n' +
      'Xuyên suốt khoá là backend của một ứng dụng đặt hàng: người dùng, sản phẩm, tồn kho, đơn hàng và lịch sử thanh toán. Chúng ta đi qua những tình huống mà dự án thật nào cũng gặp:\n' +
      '• Chọn kiểu dữ liệu: uuid, timestamptz, numeric cho tiền, jsonb cho dữ liệu linh hoạt\n' +
      '• Dùng ràng buộc CHECK, UNIQUE, foreign key để database tự bảo vệ dữ liệu\n' +
      '• Viết migration thêm cột, thêm index mà không khoá bảng lâu\n' +
      '• Đọc EXPLAIN ANALYZE, chọn B-tree, partial index hay GIN\n' +
      '• Phân trang keyset, transaction, MVCC và SELECT ... FOR UPDATE\n\n' +
      'Học xong, bạn có thể tự chẩn đoán một truy vấn chậm, đề xuất index phù hợp kèm bằng chứng từ query plan, viết logic trừ tồn kho không bị bán vượt khi nhiều người mua cùng lúc, và cấu hình connection pool hợp lý cho ứng dụng Node.js.\n\n' +
      'Mỗi bài có script SQL và dữ liệu mẫu đủ lớn để thấy khác biệt hiệu năng thật. Khoá không đi vào quản trị server hay replication, mà tập trung vào những gì một backend developer cần biết để viết code đúng và nhanh ngay từ tầng database.',
    learningObjectives: [
      'Chọn kiểu dữ liệu và ràng buộc phù hợp để database tự chặn dữ liệu sai',
      'Đọc kết quả EXPLAIN ANALYZE và chỉ ra nút tốn thời gian nhất trong query plan',
      'Tạo B-tree, partial index và GIN index cho jsonb dựa trên truy vấn thực tế',
      'Viết phân trang keyset thay cho OFFSET để danh sách lớn vẫn tải nhanh',
      'Xử lý cập nhật đồng thời bằng transaction và SELECT ... FOR UPDATE',
      'Viết migration thêm cột, thêm index mà không khoá bảng trong thời gian dài',
    ],
    requirements: [
      'Viết được SQL cơ bản và đã từng xây một API có kết nối database',
      'Biết dùng Docker ở mức chạy container',
    ],
    targetAudience: [
      'Backend developer dùng PostgreSQL qua ORM muốn hiểu sâu hơn',
      'Lập trình viên chuẩn bị phỏng vấn vị trí backend middle',
    ],
    thumbnail: { label: 'PostgreSQL', tagline: 'Database vững cho backend' },
    sections: [
      {
        title: 'Chuẩn bị',
        lectures: [
          'Giới thiệu khoá học và schema ứng dụng đặt hàng mẫu',
          'Chạy PostgreSQL 16 bằng Docker, dùng psql và pgAdmin',
        ],
      },
      {
        title: 'Kiểu dữ liệu và ràng buộc',
        lectures: [
          'Kiểu dữ liệu đáng dùng: uuid, timestamptz, numeric, jsonb',
          'Ràng buộc CHECK, UNIQUE, foreign key và ON DELETE',
          'Migration an toàn: thêm cột, thêm index không khoá bảng lâu',
        ],
      },
      {
        title: 'Hiệu năng truy vấn',
        lectures: [
          'EXPLAIN ANALYZE: đọc plan, Seq Scan và Index Scan',
          'Index B-tree, partial index và GIN cho jsonb',
          'Phân trang keyset thay cho OFFSET',
        ],
      },
      {
        title: 'Đồng thời và vận hành',
        lectures: [
          'Transaction, MVCC và SELECT ... FOR UPDATE',
          'Connection pool với PgBouncer và cấu hình cho ứng dụng Node.js',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: PostgreSQL cho backend',
      description: 'Ôn lại kiểu dữ liệu, index, phân trang và xử lý đồng thời trong PostgreSQL.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Ứng dụng có người dùng ở nhiều múi giờ. Nên lưu thời điểm tạo đơn hàng bằng kiểu nào?',
          relatedLecture: 2,
          options: [
            {
              content: 'timestamptz',
              correct: true,
              explanation: 'Đúng. timestamptz lưu một thời điểm tuyệt đối (quy về UTC) và hiển thị theo múi giờ của phiên kết nối.',
            },
            {
              content: 'timestamp (without time zone)',
              explanation: 'Sai. Kiểu này không biết giá trị thuộc múi giờ nào, dễ lệch giờ khi server hoặc client đổi múi giờ.',
            },
            {
              content: 'varchar dạng ISO 8601',
              explanation: 'Sai. Lưu chuỗi mất khả năng so sánh, tính toán thời gian và kiểm tra hợp lệ ở tầng database.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Vì sao truy vấn ORDER BY id LIMIT 20 OFFSET 100000 chậm dần khi người dùng xem các trang sau?',
          relatedLecture: 7,
          options: [
            {
              content: 'PostgreSQL vẫn phải đọc rồi bỏ qua 100000 dòng trước khi trả về 20 dòng cần lấy',
              correct: true,
              explanation: 'Đúng. Phân trang keyset (WHERE id > :last_id ORDER BY id LIMIT 20) nhảy thẳng tới vị trí cần đọc qua index.',
            },
            {
              content: 'Do LIMIT không dùng được index',
              explanation: 'Sai. LIMIT kết hợp ORDER BY trên cột có index vẫn dùng index, vấn đề nằm ở số dòng phải bỏ qua.',
            },
            {
              content: 'Do PostgreSQL giới hạn OFFSET tối đa',
              explanation: 'Sai. Không có giới hạn như vậy, truy vấn vẫn chạy đúng nhưng chậm.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: "Cột metadata kiểu jsonb, truy vấn thường dùng là WHERE metadata @> '{\"plan\": \"pro\"}'. Những phát biểu nào đúng?",
          relatedLecture: 6,
          options: [
            {
              content: 'Index GIN trên metadata giúp tăng tốc toán tử @>',
              correct: true,
              explanation: 'Đúng. GIN lập chỉ mục từng khoá và giá trị bên trong jsonb, phù hợp cho phép kiểm tra chứa (containment).',
            },
            {
              content: 'GIN với jsonb_path_ops nhỏ hơn và vẫn hỗ trợ @>',
              correct: true,
              explanation: 'Đúng. jsonb_path_ops chỉ hỗ trợ ít toán tử hơn nhưng index gọn và nhanh hơn cho @>.',
            },
            {
              content: 'Index B-tree trên metadata là đủ cho @>',
              explanation: 'Sai. B-tree so sánh toàn bộ giá trị, không hiểu cấu trúc bên trong jsonb nên không hỗ trợ @>.',
            },
            {
              content: 'Đổi cột sang kiểu json sẽ giúp GIN index chạy nhanh hơn',
              explanation: 'Sai. Kiểu json lưu dạng text và không có operator class GIN mặc định, jsonb mới là kiểu nên dùng.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Hai request đồng thời cùng đọc tồn kho = 1 rồi cùng trừ đi 1, kết quả bán vượt. Cách xử lý phù hợp là gì?',
          relatedLecture: 8,
          options: [
            {
              content: 'Trong transaction, đọc dòng tồn kho bằng SELECT ... FOR UPDATE trước khi trừ',
              correct: true,
              explanation: 'Đúng. FOR UPDATE khoá dòng, request thứ hai phải chờ và sẽ đọc giá trị đã được cập nhật.',
            },
            {
              content: 'Thêm index trên cột tồn kho',
              explanation: 'Sai. Index tăng tốc tìm kiếm, không ngăn hai giao dịch cùng đọc giá trị cũ.',
            },
            {
              content: 'Bọc hai câu lệnh trong transaction ở mức READ COMMITTED là đủ',
              explanation: 'Sai. Ở READ COMMITTED, hai giao dịch vẫn đọc được cùng giá trị 1 nếu không khoá dòng hoặc dùng UPDATE có điều kiện.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Khoá ngoại order_items.order_id khai báo ON DELETE CASCADE. Khi xoá một đơn hàng thì sao?',
          relatedLecture: 3,
          options: [
            {
              content: 'Các dòng order_items của đơn đó bị xoá theo',
              correct: true,
              explanation: 'Đúng. CASCADE lan thao tác xoá xuống bảng con, phù hợp khi bảng con không có ý nghĩa nếu thiếu bảng cha.',
            },
            {
              content: 'Lệnh xoá bị từ chối nếu còn order_items',
              explanation: 'Sai. Đó là hành vi của RESTRICT hoặc NO ACTION, mặc định khi không khai báo ON DELETE.',
            },
            {
              content: 'order_id trong order_items được đặt thành NULL',
              explanation: 'Sai. Đó là hành vi của ON DELETE SET NULL.',
            },
          ],
        },
      ],
    },
  },

  // D6
  {
    instructorEmail: 'kiet.dang@skillpath.test',
    categorySlug: 'data-science',
    topics: [{ slug: 'data-engineering', primary: true }, { slug: 'python' }, { slug: 'sql' }],
    language: 'vi',
    level: 'intermediate',
    priceAmount: 799_000,
    status: 'published',
    title: 'Data Engineering với Python: xây pipeline ETL',
    subtitle: 'Tự xây pipeline ETL bằng Python và PostgreSQL: lấy dữ liệu, làm sạch, nạp kho và lập lịch chạy',
    description:
      'Đội phân tích cần số liệu mới mỗi sáng, nhưng dữ liệu nằm rải rác ở file CSV từ đối tác, API của hệ thống bán hàng và database của ứng dụng. Script tự viết chạy được vài tuần thì bắt đầu lỗi: bản ghi trùng, dữ liệu đến trễ, chạy lại thì số nhân đôi. Data engineering là nghề giải quyết đúng những vấn đề đó, và khoá học này giúp bạn bắt đầu bằng một pipeline hoàn chỉnh.\n\n' +
      'Chúng ta xây pipeline cho dữ liệu đơn hàng và sự kiện người dùng của một cửa hàng trực tuyến mô phỏng, đi qua đủ các bước:\n' +
      '• Extract: đọc từ CSV, JSON và REST API có phân trang\n' +
      '• Transform: chuẩn hoá kiểu dữ liệu, loại bản ghi lỗi, khử trùng lặp\n' +
      '• Load: nạp vào PostgreSQL bằng COPY và upsert để chạy lại không sinh trùng\n' +
      '• Mô hình hoá star schema với bảng fact và dimension\n' +
      '• Nạp tăng dần bằng watermark, lập lịch với Apache Airflow và kiểm tra chất lượng dữ liệu\n\n' +
      'Học xong, bạn có một pipeline chạy hằng ngày, chạy lại bao nhiêu lần cũng ra cùng kết quả, có log và cảnh báo khi dữ liệu bất thường. Bạn cũng hiểu các nguyên tắc quan trọng hơn công cụ: idempotency, xử lý dữ liệu đến trễ, tách biệt từng bước để dễ kiểm tra.\n\n' +
      'Khoá học thiên về thực hành, mỗi chương thêm một phần vào cùng một dự án nên cuối khoá bạn có sản phẩm để đưa vào portfolio. Bài code trên nền tảng giúp bạn luyện bước transform quan trọng nhất: làm sạch và khử trùng lặp dữ liệu sự kiện bằng Python thuần, đúng cách bạn sẽ làm trong pipeline thật.',
    learningObjectives: [
      'Viết bước extract đọc dữ liệu từ CSV, JSON và REST API có phân trang',
      'Làm sạch dữ liệu, loại bản ghi lỗi và khử trùng lặp theo khoá nghiệp vụ',
      'Nạp dữ liệu vào PostgreSQL bằng COPY và upsert để pipeline chạy lại an toàn',
      'Thiết kế star schema gồm bảng fact và dimension cho nhu cầu báo cáo',
      'Lập lịch pipeline bằng Apache Airflow và cài đặt kiểm tra chất lượng dữ liệu',
    ],
    requirements: [
      'Viết được Python cơ bản: hàm, dict, list, đọc ghi file',
      'Viết được truy vấn SQL với JOIN và GROUP BY',
    ],
    targetAudience: [
      'Lập trình viên backend hoặc Data Analyst muốn chuyển sang Data Engineer',
      'Sinh viên CNTT muốn hiểu dữ liệu chảy từ ứng dụng đến báo cáo như thế nào',
    ],
    thumbnail: { label: 'ETL Pipeline', tagline: 'Dữ liệu sạch, chạy mỗi ngày' },
    sections: [
      {
        title: 'Tổng quan Data Engineering',
        lectures: [
          'Giới thiệu khoá học và kiến trúc pipeline sẽ xây',
          'Dựng môi trường: Python, PostgreSQL và Docker Compose',
        ],
      },
      {
        title: 'Extract và Transform',
        lectures: [
          'Extract: đọc dữ liệu từ CSV, JSON và REST API',
          'Transform: chuẩn hoá kiểu dữ liệu, xử lý bản ghi lỗi',
          'Khử trùng lặp và làm việc với dữ liệu đến trễ',
        ],
      },
      {
        title: 'Load và mô hình hoá kho dữ liệu',
        lectures: [
          'Load vào PostgreSQL: COPY và upsert với ON CONFLICT',
          'Mô hình hoá star schema: bảng fact và dimension',
          'Nạp tăng dần (incremental load) bằng watermark',
        ],
      },
      {
        title: 'Vận hành pipeline',
        lectures: [
          'Lập lịch và orchestration với Apache Airflow',
          'Kiểm tra chất lượng dữ liệu, ghi log và cảnh báo',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: pipeline ETL',
      description: 'Ôn lại idempotency, star schema, nạp tăng dần và kiểm tra chất lượng dữ liệu.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Pipeline bị lỗi giữa chừng và phải chạy lại cho cùng một ngày. Cách load nào giúp không sinh dữ liệu trùng?',
          relatedLecture: 5,
          options: [
            {
              content: 'INSERT ... ON CONFLICT (khoá nghiệp vụ) DO UPDATE',
              correct: true,
              explanation: 'Đúng. Upsert theo khoá nghiệp vụ giúp bước load idempotent: chạy một lần hay nhiều lần đều cho cùng kết quả.',
            },
            {
              content: 'INSERT thông thường cho toàn bộ dữ liệu của ngày',
              explanation: 'Sai. Mỗi lần chạy lại sẽ chèn thêm một bản sao, số liệu báo cáo bị nhân lên.',
            },
            {
              content: 'TRUNCATE toàn bộ bảng đích rồi chỉ nạp dữ liệu ngày đó',
              explanation: 'Sai. Cách này làm mất dữ liệu của mọi ngày khác trong bảng.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Trong star schema cho báo cáo bán hàng, bảng fact_orders thường chứa gì?',
          relatedLecture: 6,
          options: [
            {
              content: 'Các chỉ số đo lường như số lượng, doanh thu và khoá ngoại tới các bảng dimension',
              correct: true,
              explanation: 'Đúng. Bảng fact lưu sự kiện có thể cộng dồn, còn mô tả chi tiết nằm ở dimension.',
            },
            {
              content: 'Thông tin mô tả khách hàng như tên, địa chỉ, phân khúc',
              explanation: 'Sai. Đó là nội dung của bảng dimension, ví dụ dim_customer.',
            },
            {
              content: 'Bản sao nguyên trạng của bảng orders trong database ứng dụng',
              explanation: 'Sai. Bảng fact được mô hình hoá lại cho mục đích phân tích, không chép nguyên bảng nguồn.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Khi nạp tăng dần bằng watermark updated_at, lần chạy sau nên lấy dữ liệu nào?',
          relatedLecture: 7,
          options: [
            {
              content: 'Các bản ghi có updated_at lớn hơn watermark đã lưu ở lần chạy thành công trước',
              correct: true,
              explanation: 'Đúng. Watermark chỉ cập nhật khi lần chạy thành công, nên lần lỗi sẽ được lấy lại ở lần sau.',
            },
            {
              content: 'Toàn bộ bản ghi trong bảng nguồn',
              explanation: 'Sai. Đó là full load, tốn tài nguyên và thời gian khi bảng nguồn lớn.',
            },
            {
              content: 'Các bản ghi có created_at trong ngày hôm nay',
              explanation: 'Sai. Cách này bỏ sót bản ghi cũ vừa được cập nhật và dữ liệu đến trễ.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những kiểm tra nào nên có trong bước kiểm tra chất lượng dữ liệu sau khi load?',
          relatedLecture: 9,
          options: [
            {
              content: 'Số dòng nạp vào không giảm đột ngột so với các ngày trước',
              correct: true,
              explanation: 'Đúng. Số dòng giảm mạnh thường báo hiệu nguồn bị lỗi hoặc bước extract bỏ sót dữ liệu.',
            },
            {
              content: 'Cột khoá không NULL và không trùng',
              correct: true,
              explanation: 'Đúng. Khoá trùng hoặc rỗng làm sai mọi phép JOIN và tổng hợp phía sau.',
            },
            {
              content: 'Giá trị nằm trong miền hợp lệ, ví dụ số tiền không âm',
              correct: true,
              explanation: 'Đúng. Kiểm tra miền giá trị bắt được lỗi chuyển đổi kiểu hoặc dữ liệu nguồn bất thường.',
            },
            {
              content: 'Tên file nguồn viết thường toàn bộ',
              explanation: 'Sai. Đây chỉ là quy ước đặt tên file, không nói gì về chất lượng dữ liệu bên trong.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Vì sao mỗi task trong Airflow DAG nên xử lý dữ liệu theo khoảng thời gian của logical date thay vì "dữ liệu mới nhất"?',
          relatedLecture: 8,
          options: [
            {
              content: 'Để chạy lại hoặc backfill một ngày cụ thể mà không ảnh hưởng ngày khác',
              correct: true,
              explanation: 'Đúng. Gắn task với khoảng thời gian cố định giúp kết quả tái lập được, nền tảng của pipeline idempotent.',
            },
            {
              content: 'Vì Airflow không cho phép truy vấn dữ liệu mới nhất',
              explanation: 'Sai. Airflow không giới hạn task đọc dữ liệu gì, đây là nguyên tắc thiết kế.',
            },
            {
              content: 'Để DAG chạy nhanh hơn',
              explanation: 'Sai. Mục đích chính là tính tái lập và an toàn khi chạy lại, không phải tốc độ.',
            },
          ],
        },
      ],
    },
    exercise: {
      title: 'Làm sạch và tổng hợp sự kiện theo ngày',
      learningObjective: 'Viết bước transform loại bản ghi lỗi, khử trùng lặp theo event_id và tổng hợp theo ngày',
      instructions:
        'Mỗi dòng của stdin là một sự kiện dạng JSON với các trường event_id (chuỗi), user_id (chuỗi), amount (số nguyên ≥ 0) và ts (chuỗi thời gian ISO, 10 ký tự đầu là ngày YYYY-MM-DD). Bỏ qua dòng trống.\n\n' +
        'Quy tắc:\n' +
        '• Dòng không phải JSON object, thiếu trường, sai kiểu (amount phải là số nguyên, không phải chuỗi hay true/false), amount âm hoặc ts ngắn hơn 10 ký tự là bản ghi lỗi.\n' +
        '• Bản ghi hợp lệ có event_id đã gặp trước đó là bản trùng, chỉ giữ bản đầu tiên.\n\n' +
        'Output: với mỗi ngày (tăng dần) in <ngày>,<số sự kiện>,<số user khác nhau>,<tổng amount>. Sau đó in rejected=<số bản ghi lỗi> và duplicates=<số bản trùng>.\n\n' +
        'Ví dụ input:\n' +
        '{"event_id":"e1","user_id":"u1","amount":120000,"ts":"2024-05-01T08:15:00Z"}\n' +
        '{"event_id":"e1","user_id":"u1","amount":120000,"ts":"2024-05-01T08:15:00Z"}\n' +
        'not json\n\n' +
        'Output:\n' +
        '2024-05-01,1,1,120000\n' +
        'rejected=1\n' +
        'duplicates=1',
      hints: [
        'Bọc json.loads trong try/except json.JSONDecodeError để bắt dòng không phải JSON',
        'isinstance(True, int) trả về True, nên dùng type(amount) is int để loại giá trị boolean',
        'Dùng set lưu event_id đã gặp và dict theo ngày để cộng dồn số sự kiện, user và amount',
      ],
      solutionExplanation:
        'Tách hàm parse kiểm tra từng dòng và trả về None nếu lỗi, giúp phần chính chỉ lo đếm. Duyệt từng dòng: dòng lỗi tăng rejected; dòng hợp lệ có event_id đã nằm trong set tăng duplicates; còn lại thêm vào set và cộng dồn vào dict theo ngày (số sự kiện, set user, tổng amount). Cuối cùng in các ngày theo thứ tự tăng dần rồi hai dòng thống kê. Tách kiểm tra hợp lệ ra một hàm thuần là cách làm phổ biến trong pipeline thật vì dễ viết unit test.',
      difficulty: 'medium',
      relatedLecture: 4,
      code: [
        {
          language: 'python',
          starter: PY_STARTER('Duyệt từng dòng JSON, loại bản ghi lỗi, khử trùng theo event_id rồi tổng hợp theo ngày'),
          solution: EVENTS_SOLUTION,
        },
      ],
      tests: [
        {
          input:
            '{"event_id":"e1","user_id":"u1","amount":120000,"ts":"2024-05-01T08:15:00Z"}\n{"event_id":"e2","user_id":"u2","amount":80000,"ts":"2024-05-01T09:00:00Z"}\n{"event_id":"e1","user_id":"u1","amount":120000,"ts":"2024-05-01T08:15:00Z"}\n{"event_id":"e3","user_id":"u1","amount":50000,"ts":"2024-05-02T10:30:00Z"}\nnot json\n',
          expectedOutput: '2024-05-01,2,2,200000\n2024-05-02,1,1,50000\nrejected=1\nduplicates=1',
          isPublic: true,
        },
        {
          input:
            '{"event_id":"a1","user_id":"u7","amount":"30000","ts":"2024-06-10T01:00:00Z"}\n{"event_id":"a2","user_id":"u7","amount":30000,"ts":"2024-06-10T01:05:00Z"}\n{"event_id":"a3","user_id":"u8","amount":-5000,"ts":"2024-06-10T02:00:00Z"}\n{"event_id":"a4","amount":10000,"ts":"2024-06-11T02:00:00Z"}\n{"event_id":"a5","user_id":"u7","amount":45000,"ts":"2024-06-11T03:00:00Z"}\n',
          expectedOutput: '2024-06-10,1,1,30000\n2024-06-11,1,1,45000\nrejected=3\nduplicates=0',
          isPublic: false,
        },
        {
          input:
            '{"event_id":"x3","user_id":"u2","amount":0,"ts":"2024-07-03T12:00:00Z"}\n{"event_id":"x1","user_id":"u1","amount":200000,"ts":"2024-07-01T12:00:00Z"}\n\n{"event_id":"x2","user_id":"u1","amount":150000,"ts":"2024-07-01T18:00:00Z"}\n{"event_id":"x1","user_id":"u1","amount":999999,"ts":"2024-07-02T12:00:00Z"}\n[1,2,3]\n{"event_id":"x4","user_id":"u3","amount":true,"ts":"2024-07-03T13:00:00Z"}\n',
          expectedOutput: '2024-07-01,2,1,350000\n2024-07-03,1,1,0\nrejected=2\nduplicates=1',
          isPublic: false,
        },
        {
          input: '{"broken": \n{"event_id":"z1","user_id":"u1","amount":10,"ts":"2024"}\n',
          expectedOutput: 'rejected=2\nduplicates=0',
          isPublic: false,
        },
      ],
    },
  },

  // D7
  {
    instructorEmail: 'kiet.dang@skillpath.test',
    categorySlug: 'data-science',
    topics: [{ slug: 'apache-kafka', primary: true }, { slug: 'data-engineering' }],
    language: 'en',
    level: 'advanced',
    priceAmount: 999_000,
    status: 'published',
    title: 'Apache Kafka in Practice',
    subtitle: 'Build reliable event streaming with Kafka: durable producers, scalable consumers and exactly-once processing',
    description:
      "Most teams adopt Kafka for a good reason, then spend months fighting the same problems: duplicated messages after a producer retry, consumers that rebalance every few minutes, lag that keeps growing at peak hours, and nobody quite sure whether an event was processed once, twice or not at all. This course is about getting those details right, so Kafka becomes the dependable backbone it is supposed to be.\n\n" +
      "We build an order-tracking system end to end. Order, payment and shipment services publish events, a stream processor joins them into a live order status, and a connector keeps a PostgreSQL reporting table in sync. Along the way you will learn:\n" +
      "• How topics, partitions and offsets really work, and how to pick a partition key\n" +
      "• Producer settings that matter: acks, retries, idempotence and batching\n" +
      "• Consumer groups, rebalancing and committing offsets without losing data\n" +
      "• Schema evolution with Avro and a schema registry\n" +
      "• Kafka Streams, transactions and exactly-once processing\n" +
      "• Kafka Connect, consumer lag monitoring and throughput tuning\n\n" +
      "By the end you will be able to design a topic layout for a new domain, configure producers and consumers for the delivery guarantee your use case actually needs, explain what happens during a rebalance, and diagnose a lagging consumer group with metrics instead of guesswork.\n\n" +
      "Every module runs on a local multi-broker cluster in KRaft mode, so you can kill brokers, pause consumers and watch how the system reacts. Code samples are in Java for Kafka Streams and Python for simple producers and consumers. This is not an introduction to messaging: it assumes you have built backend services before and want a production-level understanding of Kafka.",
    learningObjectives: [
      'Design topics and partition keys that preserve ordering where the business needs it',
      'Configure idempotent producers with the right acks, retries and batching settings',
      'Run consumer groups that commit offsets safely and recover cleanly from rebalances',
      'Evolve event schemas with Avro without breaking existing consumers',
      'Build Kafka Streams applications with stateful joins and exactly-once processing',
      'Monitor consumer lag and tune brokers, producers and consumers for throughput',
    ],
    requirements: [
      'Experience building backend services in Java, Python or a similar language',
      'Comfortable with Docker and the command line',
    ],
    targetAudience: [
      'Backend and data engineers running or about to adopt Kafka in production',
      'Engineers preparing to design event-driven architectures',
    ],
    thumbnail: { label: 'Apache Kafka', tagline: 'Event streaming done right' },
    sections: [
      {
        title: 'Getting started',
        lectures: [
          'Course overview and the order-tracking system we will build',
          'Running a local Kafka cluster in KRaft mode with Docker Compose',
        ],
      },
      {
        title: 'Producers and consumers',
        lectures: [
          'Topics, partitions and offsets: how Kafka stores data',
          'Writing reliable producers: acks, retries and idempotence',
          'Consumer groups, rebalancing and offset commits',
        ],
      },
      {
        title: 'Stream processing',
        lectures: [
          'Event schemas with Avro and a schema registry',
          'Kafka Streams: stateless and stateful transformations',
          'Exactly-once semantics with transactions',
        ],
      },
      {
        title: 'Operating Kafka',
        lectures: [
          'Kafka Connect: syncing events into PostgreSQL',
          'Monitoring consumer lag and tuning for throughput',
        ],
      },
    ],
    quiz: {
      title: 'Quiz: Kafka delivery guarantees',
      description: 'Check your understanding of partitions, producer reliability, consumer groups and transactions.',
      questions: [
        {
          type: 'single_choice',
          stem: 'What ordering guarantee does Kafka provide for messages in a topic?',
          relatedLecture: 2,
          options: [
            {
              content: 'Messages are ordered within a single partition only',
              correct: true,
              explanation: 'Correct. Ordering is per partition, which is why events that must stay in order should share a partition key.',
            },
            {
              content: 'Messages are ordered across the whole topic',
              explanation: 'Incorrect. Different partitions are written and read independently, so there is no global order.',
            },
            {
              content: 'Kafka provides no ordering guarantee at all',
              explanation: 'Incorrect. Within one partition, offsets are strictly increasing and consumers read them in order.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What problem does enable.idempotence=true solve on the producer?',
          relatedLecture: 3,
          options: [
            {
              content: 'Duplicate records written when the producer retries after a timeout',
              correct: true,
              explanation: 'Correct. The broker uses the producer ID and sequence numbers to discard retried batches it has already written.',
            },
            {
              content: 'Consumers processing the same record twice after a rebalance',
              explanation: 'Incorrect. Idempotence only covers writes from one producer session; consumer-side duplicates need transactions or idempotent processing.',
            },
            {
              content: 'Records being lost when a broker disk fails',
              explanation: 'Incorrect. Durability comes from replication and acks=all, not from idempotence.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Which events trigger a rebalance in a consumer group?',
          relatedLecture: 4,
          options: [
            {
              content: 'A new consumer joins the group',
              correct: true,
              explanation: 'Correct. Partitions must be redistributed to include the new member.',
            },
            {
              content: 'A consumer takes longer than max.poll.interval.ms between polls',
              correct: true,
              explanation: 'Correct. The coordinator considers it stuck, removes it from the group and reassigns its partitions.',
            },
            {
              content: 'Partitions are added to a subscribed topic',
              correct: true,
              explanation: 'Correct. The new partitions need an owner, so the group rebalances.',
            },
            {
              content: 'A consumer commits its offsets',
              explanation: 'Incorrect. Committing offsets is routine and does not change partition ownership.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'A topic has 6 partitions and its consumer group runs 8 instances. What happens?',
          relatedLecture: 4,
          options: [
            {
              content: '6 instances each own one partition and 2 instances stay idle',
              correct: true,
              explanation: 'Correct. A partition is assigned to at most one consumer in a group, so extra instances only act as standbys.',
            },
            {
              content: 'Each partition is shared by several instances to spread the load',
              explanation: 'Incorrect. Within one group, a partition is never consumed by two members at the same time.',
            },
            {
              content: 'Kafka automatically creates 2 more partitions',
              explanation: 'Incorrect. Partition count only changes when an operator increases it explicitly.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'A consumer reads a topic written by a transactional producer. Which setting stops it from seeing records from aborted transactions?',
          relatedLecture: 7,
          options: [
            {
              content: 'isolation.level=read_committed',
              correct: true,
              explanation: 'Correct. The consumer only returns records from committed transactions and skips aborted ones.',
            },
            {
              content: 'enable.auto.commit=false',
              explanation: 'Incorrect. This controls when the consumer commits its own offsets, not which records it can read.',
            },
            {
              content: 'acks=all',
              explanation: 'Incorrect. acks is a producer setting for durability and has no effect on what consumers see.',
            },
          ],
        },
      ],
    },
  },
];
