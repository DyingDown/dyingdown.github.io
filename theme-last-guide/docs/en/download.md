## HEXO Support

This theme is built with the support of Hexo, and using this theme requires setting up a Hexo blog.

Learn how to create a Hexo blog: [Build Blog](https://dyingdown.github.io/2019/08/13/Build-Blog/)

## Browser Support

This theme does not support certain older versions of the Internet Explorer browser.

## Plugin Support

The theme utilizes the `stylus` and `pug` template engines. If they are not installed, you need to install them first.

=== "npm"
	
	``` 
	npm install hexo-renderer-stylus hexo-renderer-pug
	```

=== "yarn"
	```
	yarn add hexo-renderer-stylus hexo-renderer-pug
	```

## Download

=== "Git Clone"

	Navigate to the `\themes` directory inside your blog's directory.
	
	``` bash
	git clone https://github.com/DyingDown/hexo-theme-last.git
	```

=== "Download Zip"
	Download the ZIP file directly from [Github](https://github.com/DyingDown/hexo-theme-last), and then unzip it into the `\themes` directory.

## Usage

In the `_config_yml` file at the root of your blog, locate the following option and make the following modification:

```yml
theme: hexo-theme-last
```

