## 最终效果图：
![profile.gif](https://cdn.nlark.com/yuque/0/2023/gif/34898159/1675322994541-2708683b-22c9-480d-a21d-1b15fd712ced.gif#averageHue=%23000100&clientId=u8793c2e8-68fb-4&from=paste&height=492&id=u579abb7c&originHeight=582&originWidth=1000&originalType=binary&ratio=1&rotation=0&showTitle=false&size=5120216&status=done&style=none&taskId=u279b6680-f632-4f32-80dd-0acab92ab25&title=&width=844.6666870117188)
Github: [https://github.com/Eric-Schecter/particles-demo](https://github.com/Eric-Schecter/particles-demo)
Demo: [https://simple-particles-demo.netlify.app/](https://simple-particles-demo.netlify.app/)
## 项目说明
粒子效果是非常有趣的渲染效果，借助于GPU的加速计算，使得实时交互变为可能。
本Demo主要基于WebGL的transform feedback实现粒子交互效果。
技术栈：React，WebGL，gl-matrix
除了transform feedback，还可以基于framebuffer以纹理为计算结果存储的解决方案，如Threejs中的GPUComputationRenderer
以下是基于Threejs中GPUComputationRenderer的粒子系统Demo
[https://music-visualizer-project.netlify.app/](https://music-visualizer-project.netlify.app/) 音乐可视化播放器  
[https://arknights-particle.netlify.app/](https://arknights-particle.netlify.app/) 借鉴于曾今出现在明日方舟官网上的粒子效果

## 实现原理
WebGL 渲染管线有两个主要阶段，分别为vertex stage和fragment stage，当顶点数据提交给GPU后，一般我们会在fragment stage之后获取到数据，用于渲染或者计算。
Transform feedback提供了在vertex stage之后提前获取数据的途径（WebGL没有geometry stage），相对于走完整个渲染管线的计算方式会有一定的性能提升。
![](https://cdn.nlark.com/yuque/0/2023/jpeg/34898159/1675323613732-36d4b350-d907-4739-a8be-4f68bf6671c4.jpeg#averageHue=%2340f440&clientId=u8793c2e8-68fb-4&from=paste&height=439&id=u97b4e47b&originHeight=850&originWidth=650&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u41d1c25c-3e22-42db-8a11-ed61e798a00&title=&width=336)
图片来源[ogldev.org](https://ogldev.org/)
## 实现步骤
首先我们需要准备两个program，一个用于更新position，一个用于渲染粒子
我们从编写shader开始，计算过程都是在顶点阶段，传入position和velocity顶点数据，还有鼠标的指针位置作为粒子聚集的目标点位，经过计算后输出结果。（计算方式仅供参考）
```glsl
#version 300 es

layout(location=0)in vec3 a_position;
layout(location=1)in vec3 a_velocity;

uniform vec2 u_target;

out vec3 newPosition;
out vec3 newVelocity;

void main(){
  vec3 target = vec3(u_target,0.);
  float dis = distance(a_position,target);
  vec3 dir = normalize(target - a_position);
  float ratio = 0.01;
  vec3 velocity = a_velocity + dir/dis * ratio;
  vec3 position = a_position + velocity;
  newPosition=position;
  newVelocity=velocity;
}

```
我们不需要片段阶段，因此保持最少的代码。
```glsl
#version 300 es

precision mediump float;

void main(){
}

```
由于要使用更新后的数据，我们需要做两件事

1. 对program的创建逻辑添加transformfeedback的支持，指定我们需要输出的变量名，在这里为“newPosition”和“newVelocity”
```typescript
const program = throwErrorIfInvalid(gl.createProgram());

const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vs);
const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fs);

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
if(varyings.length){
  // add this line to enable transform feedback when creating program
  // pass output variables' name as varyings here
  gl.transformFeedbackVaryings(program,varyings,gl.SEPARATE_ATTRIBS); 
}

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  const info = gl.getProgramInfoLog(program);
  throw Error(`Could not compile WebGL program. \n\n${info}`);
}
```

2. 添加创建transform feedback的方法
```typescript
// create transform feedback
const tf = this.gl.createTransformFeedback() as WebGLTransformFeedback;
// bind transform feedback
this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, tf);

// create buffer to optain results
this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer1);
this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer1);
this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer2);
this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 1, buffer2);

// unbind transform feedback
this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, null);
this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null); // very important
```
由于需要做pingpong更新，我们准备两组buffers/transfrom feedback/vao分别用于读取和写入。

以上是setup阶段，接下来是update阶段
数据更新阶段是传统的pingpong更新方式，读取A写入B，再交换A与B，之后进行渲染。
```typescript
const { clientWidth, clientHeight } = this.canvas;
this.gl.viewport(0, 0, clientWidth, clientHeight);

this.gl.clearColor(0, 0, 0, 1);
this.gl.clear(this.gl.COLOR_BUFFER_BIT);

// update position
this.gl.enable(this.gl.RASTERIZER_DISCARD);
this.gl.useProgram(this.position);
this.gl.uniform2fv(this.targetLoc, [this.pointer[0], this.pointer[1]]);
this.gl.bindVertexArray(this.vaoPos[this.index % this.vaoPos.length]);
this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, this.tfs[(this.index + 1) % this.vaoPos.length]);
this.gl.beginTransformFeedback(this.gl.POINTS);
this.gl.drawArrays(this.gl.POINTS, 0, this.particleCount);
this.gl.endTransformFeedback();
this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, null);
this.gl.disable(this.gl.RASTERIZER_DISCARD);

// draw particles
this.gl.useProgram(this.ps);
this.gl.bindVertexArray(this.vaoPos[(this.index + 1) % this.vaoPos.length]);
this.gl.drawArrays(this.gl.POINTS, 0, this.particleCount);

this.gl.bindVertexArray(null);
this.gl.useProgram(null);

this.index++;
```

到此基本结束，为了给渲染加点润色，我将方格像素换成圆，再结合屏幕位置变换颜色，shader代码如下：
```glsl
#version 300 es

layout(location=0)in vec3 a_position;

out vec3 v_position;

void main(){
  gl_Position=vec4(a_position,1.f);
  v_position = a_position;
  gl_PointSize = 4.;
}

```
```glsl
#version 300 es

precision mediump float;

uniform vec2 u_resolution;

out vec4 fColor;

void main(){  
  vec2 uv = gl_PointCoord.xy;
  vec2 color = gl_FragCoord.xy/u_resolution;
  if(length(uv - vec2(0.5))>.5){
    discard;
  }
  fColor=vec4(color,1.,1.);
}

```
## 参考：
[1] [https://webgl2fundamentals.org/webgl/lessons/webgl-gpgpu.html](https://webgl2fundamentals.org/webgl/lessons/webgl-gpgpu.html)  
