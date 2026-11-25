# [杂项] 关于接口和抽象类

接口和抽象类都能实现多态和代码复用，但它们解决的问题不同。前几天有刚学 Java 的学弟问到两者的区别，这里整理一下我的理解。

## 从一个通知系统的例子说起

假设我们要做一个通知系统，支持邮件、短信、站内信三种方式。

### 方案一：全用接口

```java
public interface Notifier {
    void send(String message);
}
```

然后由 `EmailNotifier`、`SmsNotifier` 等类各自实现。如果每种通知都要执行“记录日志”、“检查权限”、“重试机制”等前置或后置逻辑，把相同的代码在三个实现类里各写一遍显然不合理。

### 方案二：全用抽象类

```java
public abstract class BaseNotifier {
    protected Logger logger = LoggerFactory.getLogger(getClass());

    public final void send(String message) {
        logger.info("准备发送通知");
        doSend(message);
        logger.info("发送完成");
    }

    protected abstract void doSend(String message);
}
```

子类只需实现 `doSend`，公共流程全部收敛在父类里。但如果某一种通知还需要支持“可取消”（比如短信发送后允许撤回），由于 Java 不支持多继承，子类就无法再继承一个 `Cancelable` 抽象类。

## 抽象类和接口的分工

两者的侧重点不同：

### 抽象类表达“是什么”

`EmailNotifier` 和 `SmsNotifier` 在本质上都属于“通知器”，可以把共有的状态和流程抽到 `BaseNotifier` 中。

### 接口表达“能做什么”

“可取消”只是部分通知具备的附加能力。定义一个 `Cancelable` 接口，让需要撤回功能的类去实现即可，不会影响原有的继承体系。

## 实际项目中的取舍

在我接触过的项目里，接口的使用频率远高于抽象类，大多数模块都会先定义接口，再由具体类去实现，也就是常见的面向接口编程。

抽象类更适合用来抽象具有共同本质的实体基类，比如 `Student` 和 `Teacher` 可以共同继承 `Person`。接口则更适合描述对象具备的行为能力，例如让学生实现 `study()`，让教师实现 `teach()`。

两者在设计上是互补的：抽象类负责组织同类事物的共性，接口负责定义跨类型的能力契约。网上常有人主张“能用接口就别用抽象类”，但完全排斥抽象类往往会导致公共逻辑无处安放，代码反而更啰嗦。回到前面的通知系统，把两者结合起来会更自然：

```java
// 身份：它是一个通知器
public abstract class BaseNotifier { ... }

// 能力：支持取消
public interface Cancelable {
    void cancel();
}

// 具体实现类
public class SmsNotifier extends BaseNotifier implements Cancelable {
    public void cancel() { ... }
}
```
