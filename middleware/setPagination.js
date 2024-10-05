function setPagination(req, res, next) {
    try {
        const skip = Number(req.query.skip) || env.DEFAULT_SKIP;
        const limit = Number(req.query.limit) || env.MAX_LIMIT || 10000;
        const search = req.query.search || '';
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        let order = env.DEFAULT_SORT_DIRECTION;
        let orderBy = 'date_created_utc';
        if (req.query.sortBy) {
            order = req.query.sortBy === 'asc' ? 1 : -1;
        }
        if (req.query.orderBy) {
            orderBy = req.query.orderBy;
        }

        req.paginationOptions = {
            skip: (skip - 1) * limit,
            limit,
            order,
            orderBy,
            search,
            startDate,
            endDate
        }

        req.nextPageOptions = (items, total) => {
            return {
                total,
                items,
                skip,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }
        return next();
    } catch (error) {
        res.error("SOMETHING WENT WRONG");
    }

}

module.exports = setPagination

