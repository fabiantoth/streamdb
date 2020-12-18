const $uid = function $uid() {
    this.type = $uid
    return this
}

const $incr = function $incr() {
    this.type = $incr
    return this
}

const Any = function Any() {
    this.type = Any
    return this
}

module.exports = {
    $uid,
    $incr,
    Any
}