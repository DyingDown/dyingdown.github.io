## Table of Contents

```yml
toc:
  on: true
```


## Search Function

The theme supports three search engines: Local search, Lunr.js search, and Algolia cloud search. Choose the appropriate search method based on your needs.

### Search Engine Comparison

| Search Engine | Performance | Chinese Support | Deployment Difficulty | Recommended Use Case |
|---------------|-------------|-----------------|----------------------|---------------------|
| **Local** | Slower | Basic support | Simple | Small sites, quick deployment |
| **Lunr** | Fast | Excellent | Simple | Medium to large sites, best choice |
| **Algolia** | Very fast | Excellent | Complex | Large sites, advanced search features |

=== "Configuration Example"

    ```yml
    search:
      enable: true
      engine: lunr
      
      local:
        path: search.xml
        
      lunr:
        path: search.json
        maxResults: 30
        minQueryLength: 1
        debounceTime: 300
        
      algolia:
        # Algolia configuration is set in site root _config.yml
    ```

=== "Local & Lunr Search"
    
    <img src="../../assets/images/function/search.png" alt="Local and Lunr search preview" style="zoom:67%;" />

=== "Algolia"
    
    <img src="../../assets/images/function/search-algolia.png" alt="Algolia search preview" style="zoom:67%;" />

### Configuration Parameters

| Parameter | Description | Default | Applicable Engine |
|-----------|-------------|---------|-------------------|
| `enable` | Enable search functionality | `true` | All |
| `engine` | Search engine type: `local`, `lunr`, `algolia` | `lunr` | All |
| **Local Search Parameters** | | | |
| `local.path` | Search file path, must match `search.path` in site `_config.yml` | `search.xml` | Local |
| **Lunr Search Parameters** | | | |
| `lunr.path` | Search file path, JSON format recommended for better performance | `search.json` | Lunr |
| `lunr.maxResults` | Maximum number of search results to display | `30` | Lunr |
| `lunr.minQueryLength` | Minimum query length (1 allows single character search, good for Chinese/Japanese) | `1` | Lunr |
| `lunr.debounceTime` | Search delay in milliseconds (reduces server load) | `300` | Lunr |
| **Algolia Search Parameters** | | | |
| `algolia.*` | All Algolia configurations must be set in site root `_config.yml` | - | Algolia |

### Installation and Configuration

#### Install Required Plugins

Install the corresponding plugin based on your chosen search engine:

=== "Local Search & Lunr Search"

    ```bash
    npm install hexo-generator-search
    ```

=== "Algolia Search"

    ```bash
    npm install hexo-algoliasearch --save
    ```

#### Configure Site Search

Add search configuration to the `_config.yml` file in your site's root directory:

=== "Local Search"

    ```yaml
    search:
      path: search.xml
      field: all
      content: true
    ```

=== "Lunr Search (Recommended)"

    ```yaml
    search:
      path: search.json  # Use JSON format for better performance
      field: all
      content: true
    ```

=== "Algolia Search"

    ```yaml
    algolia:
      appId: "YOUR_APP_ID"
      apiKey: "YOUR_SEARCH_ONLY_API_KEY" 
      adminApiKey: "YOUR_ADMIN_API_KEY"
      indexName: "YOUR_INDEX_NAME"
      chunkSize: 5000
      fields:
        - content:strip:truncate,0,500
        - excerpt:strip
        - tags
        - title
        - path
    ```

#### Additional Steps for Algolia

If using Algolia search, you need to manually upload the index after each content update:

```bash
npx hexo algolia
```

**Notes:**

- Algolia requires a separate plugin `hexo-algoliasearch`, not `hexo-generator-search`
- After publishing new content, you must run `npx hexo algolia` to update the search index
- Ensure the corresponding index is created in the Algolia console


## Share Function

Using https://github.com/overtrue/share.js

```yml
Share:
  on: true 
  datasites: "facebook,twitter,qq,wechat,qzone,weibo" 
  wechatQrcodeTitle: "微信扫一扫：Share"
```

`datasites`includes options for sharing on various platforms, such as Facebook, Twitter, QQ, WeChat, Qzone, Weibo, and more.

![sites](https://cloud.githubusercontent.com/assets/1472352/11433126/05f8b0e0-94f4-11e5-9fca-74dc9d1b633f.png)

You can choose any combination of these platforms in any order.

`wechatQrcodeTitle`：The title for the WeChat floating QR code.


## Comment Function (Incomplete, only implemented for Valine)

```yml
valine:
  on: true
  appId:  # App ID
  appKey: # App Key
  verify: true # Verification code
  notify: true # Email notification for comment replies
  avatar: mp # Anonymous avatar option
  placeholder: Leave your email address so you can get reply from me!
  lang: zh-cn
  guest_info: nick,mail,link
  pageSize: 10
```

Details on how to use this will be provided later.

## Mathematical Formulas

```yml
mathjax:
  enable: true
  per_page: true
  cdn: https://cdn.jsdelivr.net/npm/mathjax/MathJax.js?config=TeX-AMS-MML_HTMLorMML
```

Requires `hexo` plugin `hexo-math` and `hexo-renderer-kramed `

```
npm install hexo-math hexo-renderer-kramed
```

The CDN can be customized, but the default should work in most cases.

It uses `kramed` for rendering, and the syntax requirements are strict. Ensure correct syntax for proper rendering.

**If rendering issues occur, try the following:**

1. Go to the `/node_modules/kramed/lib/rules/inline.js` file.

2. Comment out line 11 for `escape` and add a new line:

   ```js
   // escape: /^\\([\\`*{}\[\]()#$+\-.!_>])/,
   escape: /^\\([`*\[\]()#$+\-.!_>])/,
   ```

3. Comment out line 21 for `em` and add a new line:

   ```js
   // em: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
   em: /^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
   ```

4. Save the changes.

**Typically, inline formula rendering is correct, and issues may arise from syntax errors in block-level formulas. Ensure strict syntax correctness.**

## Site Visit Statistics (Currently Implemented for a Single Method)

### Busuanzi

[https://busuanzi.ibruce.info/](https://busuanzi.ibruce.info/)

```yaml
visits:
  on: true
```