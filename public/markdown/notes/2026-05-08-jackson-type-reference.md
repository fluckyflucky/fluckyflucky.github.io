# [后端] JSON 反序列化中 TypeReference 的使用

最近在重构后端项目时，遇到了一个 JSON 反序列化泛型集合的问题。

原本的代码如下：

```java
public List<String> getIPs() {
    ObjectMapper objectMapper = new ObjectMapper();
    try {
        return objectMapper.readValue(
            this.broadcastServerIPs,
            new TypeReference<List<String>>() {}
        );
    } catch (Exception e) {
        return new ArrayList<>();
    }
}
```

这里用 `TypeReference<List<String>>` 作为反序列化的类型模板，代码可以正常编译和运行。最开始我尝试直接传入 `List.class`，但静态检查提示类型不安全、泛型信息丢失，换成 `TypeReference` 之后问题才解决。

## 背后的原因：泛型擦除

Java 的泛型只在编译期有效，到了运行期会被擦除。也就是说，在运行时 `List<String>` 和 `List<Integer>` 都会退化成原始类型 `List`，`List.class` 本身无法携带 `<String>` 的元素类型。Jackson 在运行时拿不到这个信息，也就没法直接把 JSON 数组准确还原成 `List<String>`。

`TypeReference` 利用了 Java 匿名内部类的特性来绕开这个限制。写法 `new TypeReference<List<String>>() {}` 实际上创建了 `TypeReference<List<String>>` 的一个匿名子类。虽然运行期泛型实例会被擦除，但子类字节码的父类签名中依然完整保留着 `List<String>`。Jackson 在构造 `TypeReference` 时通过反射读取这个父类签名，就能拿到目标类型。

## 接口传参中的集合类型

在 Spring MVC 的 Controller 方法中，直接写 `@RequestBody List<User>` 通常是能正常反序列化的，因为 Spring MVC 可以反射读取方法参数的泛型签名，再交给 Jackson 处理。但如果是手动调用 `objectMapper.readValue(..., List.class)`，或者直接传递顶层泛型包装类，运行时就会丢失元素类型信息。

即便在 Controller 里，实际开发时也更建议用一层 DTO 把集合包起来：

```java
// 使用 DTO 包装泛型集合
public class IPListDTO {
    private List<String> ips;
    // getter / setter ...
}

// 在 Spring Controller 中接收 DTO
@PostMapping("/updateIPs")
public void update(@RequestBody IPListDTO ipList) {
    // ...
}
```

这样既能避免直接暴露顶层集合类型，后续接口需要补充其他字段时也更容易扩展，语义更清晰。

## 小结

Java 的泛型擦除保证了和旧版本字节码的兼容，代价是运行期丢失了部分类型信息。`TypeReference` 是 Jackson 在这一语言限制下的常见解法，理解它的原理后，遇到泛型反序列化问题时也更容易判断该怎么处理。
