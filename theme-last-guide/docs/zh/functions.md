## 目录

```yml
toc:
  on: true
```


## 搜索功能(只有本地搜索)

### 本地搜索

=== "配置"

    ```yml
    localSearch:
      on: true
      placeholder: "Type to search"
    ```
=== "预览"

    <img src="../assets/images/function/search.png" alt="search preview" style="zoom:67%;" />

该功能需要安装插件`hexo-generator-search`

``` bash
npm install hexo-generator-search
```
然后需要在根目录下的`_config.yml`文件中配置搜索

```yaml
search:
  path: search.xml
  field: all
  content: true
```

`hexo-generator-search`的使用说明： [https://github.com/wzpan/hexo-generator-search](https://github.com/wzpan/hexo-generator-search)

## 分享功能

https://github.com/overtrue/share.js

```yml
Share:
  on: true 
  datasites: "facebook,twitter,qq,wechat,qzone,weibo" 
  wechatQrcodeTitle: "微信扫一扫：Share"
```

`datasites`是可以分享的站点，有这么多可以选择

![sites](https://cloud.githubusercontent.com/assets/1472352/11433126/05f8b0e0-94f4-11e5-9fca-74dc9d1b633f.png)

微博、QQ空间、QQ好友、微信、腾讯微博、豆瓣、Facebook、Twitter、Linkedin、Google+、点点等社交网站。（其中Google+好像已经不能使用）

可以按照任意顺序组合

`wechatQrcodeTitle`：微信分享功能的悬浮二维码的标题


## 评论功能(没完成，只完成了valine)

```yml
valine:
  on: true
  appId:  # App ID
  appKey: # App Key
  verify: true # 验证码
  notify: true # 评论回复邮箱提醒
  avatar: mp # 匿名者头像选项
  placeholder: Leave your email address so you can get reply from me!
  lang: zh-cn
  guest_info: nick,mail,link
  pageSize: 10
```

具体如何使用后续会写

## 数学公式

```yml
mathjax:
  enable: true
  per_page: true
  cdn: https://cdn.jsdelivr.net/npm/mathjax/MathJax.js?config=TeX-AMS-MML_HTMLorMML
```

需要`hexo`插件`hexo-math` 和 `hexo-renderer-kramed ` 的支持

```
npm install hexo-math hexo-renderer-kramed
```

cdn可以自己配置，但是一般默认的就行。

是用`kramed`渲染，语法要求比较严格，需要绝对的正确的语法才能正确渲染，比如一些空格不能省略，因为它没有`Typora`使用的`pandoc`渲染功能强大。

**如果出现无法渲染的情况，尝试进行如下操作：**

1. 进入`/node_modules/kramed/lib/rules/inline.js`文件

2. 注释11行`escape`，添加一行:

   ```js
   // escape: /^\\([\\`*{}\[\]()#$+\-.!_>])/,
   escape: /^\\([`*\[\]()#$+\-.!_>])/,
   ```

3. 注释21行`em`，添加一行:

   ```js
   // em: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
   em: /^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
   ```

4. 保存修改

**一般内联公式渲染正确，行间公式渲染错误，考虑是否行间公式出现语法错误，必须使严格语法正确。**

## 站点访问统计(目前只实现了一种)

### 不蒜子

[https://busuanzi.ibruce.info/](https://busuanzi.ibruce.info/)

```yaml
visits:
  on: true
```