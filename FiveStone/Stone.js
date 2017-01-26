/** 棋子的类型 */
module.exports = {
    none:0,     //没有棋子
    black:1,    //黑子
    white:2,    //白子
    toString: function (i) {
        switch (i) {
            default:
                return 'none';
            case this.black:
                return 'black';
            case this.white:
                return 'white';
        }
    }
};