const compareLogic = {
    '=': function (a, b) { return a == b},
    '>': function (a, b) { return a > b},
    '>=': function (a, b) { return a > b || a == b},
    '<': function (a, b) { return a < b },
    '<=': function (a, b) { return a < b || a == b},
    '!=': function (a, b) { return a !== b},
    'and': function (a, b) { return a && b},
    'or': function (a, b) { return a || b}
}

module.exports = compareLogic