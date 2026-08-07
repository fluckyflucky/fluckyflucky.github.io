# [杂项] Git 常用命令汇总

平时高频使用的 Git 命令整理。

## 基础操作

```bash
# 初始化仓库
git init

# 克隆远程仓库
git clone <url>

# 查看当前状态
git status

# 添加文件到暂存区
git add <file>        # 添加指定文件
git add .             # 添加所有变更

# 提交
git commit -m "提交信息"

# 推送到远程
git push origin <branch>

# 拉取远程更新
git pull origin <branch>
```

`git status` 建议每次操作前后都敲一下，确认当前状态。

## 分支管理

```bash
# 查看分支
git branch            # 本地分支
git branch -r         # 远程分支
git branch -a         # 所有分支

# 创建并切换分支
git checkout -b <branch>
# 或者用更新的写法
git switch -c <branch>

# 切换分支
git checkout <branch>
git switch <branch>

# 删除分支
git branch -d <branch>       # 安全删除（未合并会报错）
git branch -D <branch>       # 强制删除

# 合并分支
git merge <branch>

# 变基
git rebase <branch>
```

关于 `merge` 和 `rebase` 的选择：自己的功能分支用 `rebase` 保持提交历史整洁，公共分支用 `merge` 保留合并记录。

## 查看历史

```bash
# 查看提交历史
git log
git log --oneline              # 单行显示
git log --oneline --graph      # 带分支图

# 查看某个文件的修改历史
git log -p <file>

# 查看某次提交的具体改动
git show <commit-hash>

# 查看谁改了哪一行
git blame <file>

# 搜索提交信息
git log --grep="关键词"
```

`git log --oneline --graph` 能直观地看到分支合并情况。`git blame` 可以定位到某行代码是谁在什么时候改的。

## 撤销与回退

```bash
# 撤销工作区的修改（未暂存）
git checkout -- <file>
git restore <file>

# 取消暂存
git reset HEAD <file>
git restore --staged <file>

# 回退到某次提交
git reset --soft <commit>     # 保留修改在暂存区
git reset --mixed <commit>    # 保留修改在工作区（默认）
git reset --hard <commit>     # 丢弃所有修改（慎用）

# 生成一个新提交来撤销某次提交
git revert <commit>
```

`reset --hard` 是个危险操作，直接丢弃所有未提交的修改。在公共分支上更推荐用 `revert`，它不改写历史，而是新增一个"反向提交"来撤销变更。

## 暂存工作区

写到一半要切分支修 bug，又不想提交半成品代码，用 `stash`：

```bash
# 暂存当前修改
git stash

# 带备注的暂存
git stash save "正在写的功能，先去修 bug"

# 查看暂存列表
git stash list

# 恢复最近一次暂存
git stash pop

# 恢复指定的暂存
git stash apply stash@{n}

# 删除暂存
git stash drop stash@{n}
```

以前不知道 `stash` 的时候，每次临时切分支都要先随便 commit 一下，回来再 reset，很麻烦。

## 远程仓库

```bash
# 查看远程仓库
git remote -v

# 添加远程仓库
git remote add origin <url>

# 拉取远程分支但不合并
git fetch origin

# 推送并设置上游分支
git push -u origin <branch>

# 删除远程分支
git push origin --delete <branch>

# 查看远程分支的跟踪关系
git branch -vv
```

`fetch` 和 `pull` 的区别：`fetch` 只把远程更新拉到本地，不自动合并；`pull` 相当于 `fetch` + `merge`。不确定远程有什么变更的时候，先 `fetch` 看一眼比较稳。

## 标签

发版本的时候会用到：

```bash
# 创建标签
git tag v1.0.0
git tag -a v1.0.0 -m "第一个正式版本"

# 查看标签
git tag

# 推送标签到远程
git push origin v1.0.0
git push origin --tags        # 推送所有标签

# 删除标签
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

## 实用技巧

```bash
# 修改最近一次提交信息
git commit --amend -m "新的提交信息"

# 把最近几次提交合并成一个
git rebase -i HEAD~3

# 只提交文件的部分修改
git add -p <file>

# 找回被删除的提交（救命用）
git reflog

# 清理已合并的本地分支
git branch --merged | grep -v "main\|master" | xargs git branch -d
```

`git reflog` 即使在 `reset --hard` 之后也能找回提交记录，只要之前 commit 过就有。

## 团队协作流程示例

以基于 develop 分支为默认开发分支的功能开发为例：

```bash
# 1. 拉取最新的 develop
git checkout develop
git pull origin develop

# 2. 从 develop 切出自己的功能分支
git checkout -b feature/my-feature

# 3. 开发完成后，提交到本地（不要 push）
git add .
git commit -m "feat: 完成某功能"

# 4. 回到 develop，拉取最新代码，再 rebase 进自己的分支
git checkout develop
git pull origin develop
git checkout feature/my-feature
git rebase develop

# 5. 如果 rebase 过程中有冲突，在本地解决
# 编辑冲突文件 → git add <file> → git rebase --continue

# 6. 确认无冲突后，推送并提交 PR
git push -u origin feature/my-feature
```

如果有不清楚的地方，先和AI/项目管理的同学提问再操作。
