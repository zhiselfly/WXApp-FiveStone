var Stone = require('Stone');

/**
 * 判断该棋盘上的该子是否符合
 */
function judge(stepStone, x, y, searchUp, calcFunc) {
    var count = 0;
    var loc = calcFunc(x, y, searchUp);
    var lastLoc = {
        x:x,
        y:y
    };
    while (loc.x < this.chessBoardSize &&
           loc.y < this.chessBoardSize &&
           loc.x >= 0 &&
           loc.y >= 0) {
        if (this.chessBoard[loc.x][loc.y].stoneType == stepStone) {
            lastLoc.x = loc.x;
            lastLoc.y = loc.y;
            count++;
        } else {
            break;
        }
        loc = calcFunc(loc.x, loc.y, searchUp);
    }
    return {
        count:count,
        'lastLoc':lastLoc
    };
}

/**
 * 按照某个方向计算下一个坐标
 * 留意胜利回调的时候调用的回调函数，这里searchUp的true都是从上到下的的
 * 会影响到计算胜利提示红线的角度计算，默认是使用acos来计算红线的弧度
 */
const judgeDirectionFunction = {
    vertical: (x, y, searchUp) => {
        return {
            x:x,
            y:searchUp ? y - 1:y + 1
        };
    },
    horizontal: (x, y, searchUp) => {
        return {
            x:searchUp ? x + 1:x - 1,
            y:y
        };
    },
    /** 从左上到右下 */
    leftSkew: (x, y, searchUp) => {
        return {
            x:searchUp ? x - 1:x + 1,
            y:searchUp ? y - 1:y + 1
        };
    },
    /** 从右上到左下 */
    rightSkew: (x, y, searchUp) => {
        return {
            x:searchUp ? x + 1:x - 1,
            y:searchUp ? y - 1:y + 1
        };
    }
};

module.exports = function (stepStone, x, y, winCallback) {
    //遍历每种判断的方向
    for (var key in judgeDirectionFunction) {
        const judgeDirectionFunc = judgeDirectionFunction[key];
        const searchUpRes = judge.call(this, stepStone, x, y, true, judgeDirectionFunc);
        const searchDownRes = judge.call(this, stepStone, x, y, false, judgeDirectionFunc);
        var count = searchUpRes.count + 1;
        count += searchDownRes.count;
        if (count >= 5) {
            winCallback.call(this, stepStone, searchUpRes.lastLoc, searchDownRes.lastLoc);
            return;
        }
    }
};