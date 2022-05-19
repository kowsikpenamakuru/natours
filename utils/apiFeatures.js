class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1a. Filtering
    const queryObj = { ...this.queryString };
    const excludeStrings = ['limit', 'sort', 'page', 'fields'];
    excludeStrings.forEach((el) => delete queryObj[el]);

    // 1b. Advanced Filtering
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );
    this.query = this.query.find(JSON.parse(queryString));
    return this;
  }

  sort() {
    this.query = this.queryString.sort
      ? this.query.sort(this.queryString.sort.split(',').join(' '))
      : this.query.sort('-createdAt');
    return this;
  }

  limit() {
    this.query = this.queryString.fields
      ? this.query.select(this.queryString.fields.split(',').join(' '))
      : this.query.select('-__v');
    return this;
  }

  paginate() {
    const pageNo = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 50;
    const skipValue = (pageNo - 1) * limit;
    this.query = this.query.skip(skipValue).limit(limit);
  }
}

module.exports = APIFeatures;
