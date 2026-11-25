# [后端] Gin 框架分层：经典的洋葱模型

## 分层前

大三做数据库课设时，我用 Go 写了一个基于 Gin 框架的后端项目。随着接口和业务规则越来越多，Router 文件很快就变得非常臃肿。

最初的登录接口是这样写的：

```go
r.POST("/login", func(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "参数错误"})
		return
	}

	user, err := db.FindUser(req.Username)
	if err != nil || user.Password != req.Password {
		c.JSON(401, gin.H{"error": "认证失败"})
		return
	}

	token := generateToken(user)
	c.JSON(200, gin.H{"token": token})
})
```

参数解析、密码校验、数据库查询和响应返回全都挤在同一个匿名函数里。项目刚起步时这样写很方便调试，可一旦接口数量上去，代码很快就会难以维护。

后来我参考 Spring Boot 的分层方式，把项目拆成了 `Controller (Handler) -> Service -> Repository` 三层：

- **Controller（Handler）层**：只负责解析请求参数和返回 HTTP 响应。
- **Service 层**：承担核心业务逻辑。在大三软件工程课设小组里负责架构设计时，我和组员用了一条很简单的划分标准：只要一段逻辑既不直接和 HTTP 请求打交道，也不直接读写数据库，就放进 Service 层。
- **Repository 层**：只负责数据库的增删改查，不关心具体的业务规则。

## 分层后

重构之后，Controller 层只保留参数绑定和响应包装，校验和签发 Token 的逻辑移到了 Service 层：

Controller 层：

```go
func LoginHandler(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "参数错误")
		return
	}

	token, err := userService.Login(req)
	if err != nil {
		response.Error(c, 401, "登录失败")
		return
	}

	response.Success(c, gin.H{"token": token})
}
```

Service 层：

```go
func (s *UserService) Login(req dto.LoginRequest) (string, error) {
	user, err := s.userRepo.FindByUsername(req.Username)
	if err != nil || user.Password != req.Password {
		return "", errors.New("认证失败")
	}

	return generateToken(user), nil
}
```

![img/fa03daba-a359-4bdc-9e74-4a96c67bf5f6.png](/img/fa03daba-a359-4bdc-9e74-4a96c67bf5f6.png)

拆分之后有一个很关键的变化：`gin.Context` 止步于 Controller 层。`gin.Context` 绑定了当前 HTTP 请求和响应的所有上下文信息，如果把它一路传进 Service 层，业务逻辑就会和 Gin 框架绑定在一起。以后如果要把 Service 层的能力复用给命令行工具或者 RPC 服务，满代码都是 `gin.Context`，迁移起来会非常麻烦。

## 小结

分层的核心目的是职责分离：Controller 处理 HTTP 协议细节，Service 承载业务规则，Repository 负责数据存取。前期确实会多写一些接口和结构体，但项目规模扩大之后，清晰的层级边界能让改动和排查问题都省心很多。
