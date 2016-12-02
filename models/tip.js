var mongodb = require('./db'),
    markdown = require('markdown').markdown;
var ObjectId = require('mongodb').ObjectID;

function Tip(title, tags, content) {
    this.title = title;
    this.tags = tags;
    this.content = content;
}

module.exports = Tip;

Tip.prototype.save = function(callback) {
    var date = new Date();
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + "-" + (date.getMonth() + 1),
        day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()),
    }

    var tip = {
        title: this.title,
        tags: this.tags,
        content: this.content,
        time: time
    }

    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('tips', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.insert(tip, {
                safe: true
            }, function(err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

Tip.getTips = function(page, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('tips', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            collection.count(query, function(err, total) {
                collection.find(query, {
                    skip: (page - 1) * 6,
                    limit: 6
                }).sort({
                    time: -1
                }).toArray(function(err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    docs.forEach(function(doc) {
                        doc.content = markdown.toHTML(doc.content);
                    });
                    callback(null, docs, total);
                });
            });
        });
    });
};

//获取Tip,content是html格式
Tip.getOne = function(id, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection("tips", function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                "_id": ObjectId(id)
            }, function(err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                doc.content = markdown.toHTML(doc.content);
                callback(null, doc);
            });
        });
    });
};

//获取编辑Tip， content是markdown源码格式
Tip.edit = function(id, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('tips', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                "_id": ObjectId(id)
            }, function(err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, doc);
            });
        });
    });
};

Tip.update = function(id, title, content, tags, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('tips', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.update({
                "_id": ObjectId(id)
            }, {
                $set: { title: title, content: content, tags: tags }
            }, function(err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

Tip.remove = function(id, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('tips', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.remove({
                "_id": ObjectId(id)
            }, {
                w: 1
            }, function(err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

Tip.getArchive = function(callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('tips', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.find({}, {
                "title": 1,
                "time": 1,
                "content": 1
            }).sort({
                time: -1
            }).toArray(function(err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

//返回所有标签
Tip.getTags = function(callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('tips', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.distinct("tags", function(err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

//返回含有特定标签的所有文章
Tip.getTag = function(tag, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('tips', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.find({
                "tags": tag
            }, {
                "title": 1,
                "time": 1,
                "content": 1
            }).sort({
                time: -1
            }).toArray(function(err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};


//返回通过标题关键字查询的所有文章信息
Tip.search = function(keyword, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('tips', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp(keyword, "i");
            collection.find({
                "title": pattern
            }, {
                "title": 1,
                "time": 1,
                "content": 1
            }).sort({
                time: -1
            }).toArray(function(err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};