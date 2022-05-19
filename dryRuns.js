/* function x() {
  return 'x';
}
console.log(typeof x);
x.a = 1;
x.b = 'b';
x.c = () => 'c';
x.d = { a: 1, b: 2, c: 3 };

console.log(x); */
// 1a. Filtering
const queryObj = { ...req.query };
const excludeStrings = ['limit', 'sort', 'page', 'fields'];
excludeStrings.forEach((el) => delete queryObj[el]);

// 1b. Advanced Filtering
let queryString = JSON.stringify(queryObj);
queryString = queryString.replace(
  /\b(gte|gt|lte|lt)\b/g,
  (match) => `$${match}`
);
console.log(JSON.parse(queryString));
let query = Tour.find(JSON.parse(queryString));

// 2. Sorting
query = req.query.sort
  ? query.sort(req.query.sort.split(',').join(' '))
  : query.sort('-createdAt');

// 3. Limiting
query = req.query.fields
  ? query.select(req.query.fields.split(',').join(' '))
  : query.select('-__v');

// 4. Pagination
const pageNo = req.query.page * 1 || 1;
const limit = req.query.limit * 1 || 50;
const skipValue = (pageNo - 1) * limit;
query = query.skip(skipValue).limit(limit);

if (req.query.page) {
  const numTours = await Tour.countDocuments();
  if (skipValue >= numTours) throw new Error('End of results');
}
