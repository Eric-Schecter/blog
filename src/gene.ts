const fs = require('fs');
const path = require('path');

type Post = {
  id: number,
  title: string,
  content: string,
  date: string,
  profile: string,
}

class BlogGenerator {
  public generate = (dir: string) => {
    fs.readdir(dir, (err: Error, files: string[]) => {
      if (err) {
        console.log('can not read blog folder:', err);
        return;
      }
      const contents: Post[] = [];
      let loadedCount = 0;
      files.forEach((file, index) => {
        fs.readFile(`${dir}/${file}`, 'utf-8', (err: Error, content: string) => {
          if (err) {
            console.log('can not read blog files:', err);
            return;
          }
          const title = file.slice(0, file.indexOf('.'));
          const birthtime = fs.statSync(`${dir}/${file}`).birthtime as Date;
          const date = `${birthtime.getFullYear()}-${birthtime.getMonth() + 1}-${birthtime.getDate()}`;
          const matches = content.match(/.(gif|png|jpg|jpeg)\]\((.+?)#/);
          const profile = (matches && matches[2]) || '';
          contents.push({
            id: index,
            title,
            content,
            date,
            profile,
          })
          loadedCount++;
          if (loadedCount === files.length) {
            contents.sort((pre, curr) => new Date(curr.date).getTime() - new Date(pre.date).getTime());
            const data = JSON.stringify(contents);
            fs.writeFileSync('src/posts.json', data);
          }
        })
      })
    })
  }
}

const blogGenerator = new BlogGenerator();
blogGenerator.generate(path.join(__dirname, './content'));

export { };