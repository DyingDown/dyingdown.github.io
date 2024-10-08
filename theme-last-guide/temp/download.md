## HEXO 支持

该主题是在hexo的支持下搭建的，使用该主题需要先搭建hexo博客。

如何创建hexo博客：[搭建博客](https://dyingdown.github.io/2019/08/13/Build-Blog/)

## 浏览器支持

本主题不支持部分低版本的IE浏览器。

## 插件支持

该主题使用`stylus`和`pug`模板引擎，如果没有安装需要先安装

=== "npm"
	
	``` 
	npm install hexo-renderer-stylus hexo-renderer-pug
	```

=== "yarn"
	```
	yarn add hexo-renderer-stylus hexo-renderer-pug
	```

## 下载

=== "Git Clone"

	进入博客目录下的`\themes`目录下
	
	``` bash
	git clone https://github.com/DyingDown/hexo-theme-last.git
	```

=== "Download Zip"
	在[Github](https://github.com/DyingDown/hexo-theme-last)上直接下载ZIP文件然后解压到`\themes`目录下

## 使用

在博客根目录下的`_config_yml`文件里，找到这一选项，进行修改

```yml
theme: hexo-theme-last
```

