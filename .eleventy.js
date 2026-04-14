module.exports = function(eleventyConfig) {
  eleventyConfig.addFilter("urlencode", val => encodeURIComponent(val));
  eleventyConfig.addPassthroughCopy("style.css");
  eleventyConfig.addPassthroughCopy("script.js");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("admin");
  return {
    dir: { input: ".", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "html"],
    htmlTemplateEngine: "njk"
  };
};
