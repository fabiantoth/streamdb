const $uid = function $uid() {
    this.type = $uid
    return this
}

const $incr = function $incr() {
    this.type = $incr
    this.options = ['type','required','min','max']
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