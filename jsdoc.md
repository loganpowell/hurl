# JSDocs doc... (meta)

## CLI configuration:
```
jsdoc -c conf.json src -r -d docs
```
### Breaking it down
- `jsdoc`: Global CLI install
- `-c conf.json`: use configuration file at this path (more below)
- `src -r`: just recurs through all the files in the `src` directory
- `-d docs`: destination folder

### Configuration file

Markdown is enabled by creating a `conf.json` file (I use root, but wherevs):
```js
{
  "plugins": ["plugins/markdown"]
}
```

### Helpful commands:
- `jsdoc -h`: Help

TODO:
See [@module FileNameOrCustomModuleName](https://stackoverflow.com/a/52712934) comments for breaking up the "everything Global" generated site structure