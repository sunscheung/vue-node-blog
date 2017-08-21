var mysql = require('mysql');
var mysqlConf = require('./db');
var sqlMap = require('./sqlMap');
var formidable = require('formidable');
var fs = require('fs');
var uuid = require('node-uuid');

// 连接数据库
var pool = mysql.createPool({
	host: mysqlConf.mysql.host,
	user: mysqlConf.mysql.user,
	password: mysqlConf.mysql.password,
	database: mysqlConf.mysql.database,
	port: mysqlConf.mysql.port
});

// 向前台返回JSON方法的简单封装
var jsonWrite = function (res, data) {
    if(typeof data === 'undefined') {
        res.json({
            code:'1',
            msg: '操作失败'
        });
    } else {
        res.json(data);
    }
};

// 数据处理
var mergeData = function(data) {
	var obj = {}, arr = [], tmp;
	for(let i = 0, len = data.length; i < len; i++){
		tmp = data[i];
		if(obj[tmp.aid]){
			obj[tmp.aid].tags.push({'id':tmp.tid, 'name':tmp.name});
		}else{
			obj[tmp.aid] = {};
			obj[tmp.aid].id = tmp.aid;
			obj[tmp.aid].user_id = tmp.user_id;
			obj[tmp.aid].title = tmp.title;
			obj[tmp.aid].type = tmp.type;
			obj[tmp.aid].loadURL = tmp.loadURL;
			obj[tmp.aid].tags = [{'id':tmp.tid, 'name':tmp.name}];
			obj[tmp.aid].summary = tmp.summary;
			obj[tmp.aid].post_time = tmp.post_time;
			obj[tmp.aid].upd_time = tmp.upd_time ? tmp.upd_time : '';
			obj[tmp.aid].view = tmp.view;
			obj[tmp.aid].start = tmp.start;
			obj[tmp.aid].state = tmp.state;
		}
	}
	for(let i in obj){
		arr.push(obj[i]);
	}
	return arr;
}

module.exports = {
	// 文章
	getArticleAll(req, res, next) {
		pool.getConnection((err, connection) => {
			connection.query(sqlMap.article.queryAll, (err, result) => {
				jsonWrite(res, mergeData(result));
				connection.release();
			})
		})
	},
	getTagAll(req, res, next) {
		pool.getConnection((err, connection) => {
			connection.query(sqlMap.tag.queryAll, (err, result) => {
				jsonWrite(res, result);
				connection.release();
			})
		})
	},
	// 标签
	getTagById(req, res, next) {
		pool.getConnection((err, connection) => {
			connection.query(sqlMap.tag.queryById, (err, result) => {
				jsonWrite(res, result);
				connection.release();
			})
		})
	},
	// 评论
	writeComment(req, res, next) {
		pool.getConnection((err, connection) => {
			var postData = req.body, time = new Date().getTime();
			connection.query(sqlMap.comment.insert, [postData.name, postData.email, postData.reminder, postData.text, postData.aid, time], (err, result) => {
				connection.release();
			})
		})
	},
	getComment(req, res, next) {
		pool.getConnection((err, connection) => {
			connection.query(sqlMap.comment.queryAll, (err, result) => {
				jsonWrite(res, result);
				connection.release();
			})
		})
	},
	// 上传图片
	uploadPic(req, res, next) {
		var form = new formidable.IncomingForm();
		form.uploadDir = '../static/images/avatar/';
		form.parse(req, (error, fields, files) => {
			for(let key in files){
				var file = files[key];
				var fileName = uuid.v1() + '_' + file.name;
				var newPath = form.uploadDir + fileName;
				jsonWrite(res, newPath);
				fs.renameSync(file.path, newPath);
				pool.getConnection((err, connection) => {
					connection.query(sqlMap.user.update, fileName, (err, result) => {
						connection.release();
					})
				})
			}
		});
	},
	// 用户
	getUserAll(req, res, next) {
		pool.getConnection((err, connection) => {
			connection.query(sqlMap.user.queryAll, (err, result) => {
				jsonWrite(res, result);
				connection.release();
			})
		})
	}
}