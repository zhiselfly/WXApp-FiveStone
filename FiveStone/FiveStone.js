var Stone = require('Stone');
var judger = require('FiveStoneJudger');

/**
 * 五子棋的主控制类
 */
export default class FiveStone {

    /**
     * 初始化棋盘
     * @param   page                    当前页面页面
     * @param   chessBoardSize          当前棋盘每行和列最多能下多少个子子
     * @param   chessboardSizePercent   棋盘的宽度相当于屏幕宽度的百分比(0<x<1)
     */
    constructor(chessBoardSize, chessboardSizePercent) {
        var self = this;
        var chessBoard = [];
        //占位
        var chessBoardCell = [];
        this.chessBoardSize = chessBoardSize;
        for (var r = 0; r < chessBoardSize; r++) {
            var row = [];
            var cellRow = [];
            for (var c = 0; c < chessBoardSize; c++) {
                row.push({
                    stoneType:Stone.none,
                    //位置使用到的时候才计算
                    pos:null
                });
                if (c < chessBoardSize - 1) {
                    cellRow.push(0);
                }
            }
            chessBoard.push(row);
            if (r < chessBoardSize - 1) {
                chessBoardCell.push(cellRow);
            }
        }
        this.chessBoard = chessBoard;
        this.chessBoardCell = chessBoardCell;
        //获取系统信息
        wx.getSystemInfo({
            success: function(res) {
                self.chessboardSizePX = res.windowWidth * chessboardSizePercent;
                console.log('%c棋盘大小:%c' +
                 self.chessboardSizePX +
                  '%cpx',
                  'color:red;',
                  'color:blue;',
                  'color:black;'
                  );
                self.cellSizePX = self.chessboardSizePX / (chessBoardSize - 1);
                console.log('%c单元格大小:%c' +
                 self.cellSizePX +
                  '%cpx',
                  'color:red;',
                  'color:blue;',
                  'color:black;'
                  );
                  self.halfCellSizePX = self.cellSizePX * 0.5;
            }
        });
        //当前下子的类型
        this.stone = Stone.black;
        //下子监听的回调集合
        this.onStepStoneCallbacks = [];
        //是否能够下子的开关
        this._canStep = true;
        //历史
        this.history = [];
        //设置裁判
        this.setJudger(judger);
    }

    /**
     * 通过事件获取下子在棋盘的位置
     */
    getStepLocation(e) {
        var curTarget = e.currentTarget;
        var offset = {
            x: curTarget.offsetLeft,
            y: curTarget.offsetTop
        };
        var touch = e.touches[0];
        //相对棋盘的位置
        var clientPos = {
            x:touch.pageX - offset.x,
            y:touch.pageY - offset.y
        };
        var stepPos = {
            x: Math.ceil((clientPos.x - this.halfCellSizePX) / this.cellSizePX),
            y: Math.ceil((clientPos.y - this.halfCellSizePX) / this.cellSizePX)
        };
        if (stepPos.x < 0 || stepPos.x >= this.chessBoardSize ||
            stepPos.y < 0 || stepPos.y >= this.chessBoardSize) {
                return null;
            }
        return stepPos;
    }

    /**
     * 通过事件获取下子在棋盘的绝对位置
     */
    getStepPosition(e) {
        var curTarget = e.currentTarget;
        var stepPos = this.getStepLocation(e);
        if (stepPos == null) {
            return null;
        }
        var absPos = stepPos.clone();
        //后面的那个1像素怎么出来的我也不知道，反正减了之后位置看起来正很多
        absPos.x = absPos.x * this.cellSizePX + curTarget.offsetLeft - this.halfCellSizePX - 1;
        absPos.y = absPos.y * this.cellSizePX + curTarget.offsetTop - this.halfCellSizePX - 1;
        this.chessBoard[stepPos.x][stepPos.y].pos = absPos.clone();
        return absPos;
    }

    /**
     * 下棋，设置的是基于棋盘的坐标
     * @return  返回true就是下子成功，否则为失败
     */
    step(x, y) {
        if (this.canStepAt(x, y)) {
            this.chessBoard[x][y].stoneType = this.nowStone();
            const nowStone = this.nowStone();
            this.stone = nowStone == Stone.black ? Stone.white:Stone.black;
            this.onStepStone(nowStone, x, y);

            if (!(this.history instanceof Array)) {
                this.history = [];
            }
            //插入到历史
            this.history.push({
                'x':x,
                'y':y,
                'stoneType':nowStone
            });
            this.judge(nowStone, x, y);
            return true;
        }
        return false;
    }

    /**
     * 悔棋
     */
    undo() {
        if (!(this.history instanceof Array) || this.history.length <= 0) {
            return;
        }
        const lastStoneIndex = this.history.length - 1;
        const lastStone = this.history[lastStoneIndex];
        this.stone = lastStone.stoneType;
        this.history.splice(lastStoneIndex, 1);
        this.chessBoard[lastStone.x][lastStone.y].stoneType = Stone.none;
        this.allowStep();
    }

    /**
     * 判断该棋子是否能够下
     */
    canStepAt(x, y) {
        if (x < 0 || x >= this.chessBoardSize ||
            y < 0 || y >= this.chessBoardSize ||
            this.chessBoard[x][y].stoneType != Stone.none) {
                return false;
        }
        return this._canStep;
    }

    /**
     * 当触发了下子的事件的时候
     */
    onStepStone(nowStone, x, y) {
        if (this.onStepStoneCallbacks instanceof Array) {
            for (var i in this.onStepStoneCallbacks) {
                const cb = this.onStepStoneCallbacks[i];
                if (typeof(cb) === 'function') {
                    cb(this, nowStone, x, y);
                }
            }
        }
    }

    /**
     * 添加下子的监听器
     * @return 如果返回0则代表插入失败，成功返回索引
     */
    addOnStepStoneCallback(func) {
        if (!(this.onStepStoneCallbacks instanceof Array)) {
            this.onStepStoneCallbacks = [];
        }
        if (typeof(func) == 'function') {
            //push以后会返回数组的长度，所以减一之后就会是对应的索引
            return this.onStepStoneCallbacks.push(func) - 1;
        }
        return 0;
    }

    /**
     * 通过索引删除下子的监听器
     */
    removeOnStepStoneCallback(index) {
        if (this.onStepStoneCallbacks instanceof Array) {
            if (this.onStepStoneCallbacks.length > index) {
                this.onStepStoneCallbacks.splice(index, 1);
            }
        }
    }

    /**
     * 重新开局
     */
    restart() {
        this.stone = Stone.black;
        for (var r in this.chessBoard) {
            for (var c in this.chessBoard[r]) {
                this.chessBoard[r][c].stoneType = Stone.none;
            }
        }
        //清空历史
        this.history = [];
        this.allowStep();
    }

    /**
     * 阻止下子
     */
    preventStep() {
        this._canStep = false;
    }

    /**
     * 允许下子
     */
    allowStep() {
        this._canStep = true;
    }

    /**
     * 获取当前是下的黑子还是白子
     */
    nowStone() {
        return this.stone;
    }

    /**
     * 返回当前是否允许下子
     */
    canStep() {
        return this._canStep;
    }

    /**
     * 进行裁判(下子成功之后触发)
     * @param stepStone 当前下子的类型
     * @param x         下子基于棋盘的x坐标
     * @param y         下子基于棋盘的y坐标
     */
    judge(stepStone, x, y) {
        if (typeof(this._judger) == 'function') {
            this._judger.call(this, stepStone, x, y, this._winCallback);
        }
    }

    /**
     * 设置裁判回调
     */
    setJudger(func) {
        if (typeof(func) == 'function') {
            this._judger = func;
        }
    }

    /**
     * 设置胜利之后的回调
     */
    setWinCallback(func) {
        if (typeof(func) == 'function') {
            this._winCallback = func;
        }
    }
}