//app.js
App({
  onLaunch: function () {
    //调用API从本地缓存中获取数据
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },
  getUserInfo:function(cb){
    var that = this
    if(this.globalData.userInfo){
      typeof cb == "function" && cb(this.globalData.userInfo)
    }else{
      //调用登录接口
      wx.login({
        success: function () {
          wx.getUserInfo({
            success: function (res) {
              that.globalData.userInfo = res.userInfo
              typeof cb == "function" && cb(that.globalData.userInfo)
            }
          })
        }
      })
    }
  },
  globalData:{
    userInfo:null
  }
});

/**
 * 定义克隆方法
 */
Object.defineProperty(
  Object.prototype, 
  'clone',
  {
    value: function () {
      var cloneSelf = {};
      for (var key in this) {
        const cloneCur = this[key];
        if (cloneCur instanceof Array ||
            typeof(cloneCur) == 'object') {
          cloneSelf[key] = cloneCur.clone();
        } else {
          cloneSelf[key] = cloneCur;
        }
      }
      return cloneSelf;
    },
    writable:false,
    enumerable:false,
    configurable:false
  });