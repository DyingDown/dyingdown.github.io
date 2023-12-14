首先，使用hexo自带的命令`hexo new page "page name"`创建新页面

## Archive页面

这个页面是不用创建就自带的。


```yml
archiveStyle:
  style: normal
  type: center # basic, split, center
  color: pink
```
**`style`样式**：comment-shape、normal

=== "normal"

	![normal](../assets/images/page/archive-normal.png)
=== "comment-shape"
	![comment-shape](../assets/images/page/archive-comment-shape.png)

**`type`结构**：basic、split、center
=== "center"
	![center](../assets/images/page/archive-normal-center.png)
=== "split"
	![split](../assets/images/page/archive-normal-split.png)
=== "basic"
	![basic](../assets/images/page/archive-normal-basic.png)


## Tags，Categories页面

需要创建名为`tags`的页面

```
hexo new page tags
```

### 预览

=== "总页面"

    ![](../assets/images/page/category-tag.png)

=== "分类"

    ![](../assets/images/page/category.png)

=== "标签"

    ![](../assets/images/page/tag.png)

## 友链接

创建友链接页面

``` bash
hexo new page links
```

如何添加友链接

1. 找到`/source/links/index.md`

2. 在=== ===包裹的段落里面添加一条

   ```markdown
   links:
     - group_name: Friends
       description: Beautiful or handsome friends
       items:
       - url: https://
         img: https://
         name: XXX
         description: Opps, he says nothing.
   ```

   - `group_name`表示对链接进行分组
   - `description`是每一个分组的描述
   - `items`里面具体是一条一条的友链接
     - 每一条友链接有四个信息：网站地址，头像地址，网站名称， 网站描述
     - 每一条连接都以一个`-`开头，格式如上

**注意：里面的看起来像是tabs的缩进，其实是空格，而且必须是空格**

![friends preview page](../assets/images/page/friends.png)