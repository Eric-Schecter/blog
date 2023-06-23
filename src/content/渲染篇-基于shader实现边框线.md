## 最终效果图：
![image.png](https://cdn.nlark.com/yuque/0/2023/png/34898159/1677032886101-924d0265-30c2-4c81-89f4-c9f8ab9e8a9d.png#averageHue=%23eeecea&clientId=u23331aff-86eb-4&from=paste&height=281&id=u312b28d2&name=image.png&originHeight=421&originWidth=599&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=30054&status=done&style=none&taskId=ud609bdc2-4577-4cf9-ac01-92947e1e558&title=&width=399.3333333333333)
## 背景说明
在Threejs当中，Mesh的边框是由gl.Lines方式绘制，为了不改变图元绘制方式，本文档说明如何通过shader实现边框着色的效果。
以下为初始的样本。
![image.png](https://cdn.nlark.com/yuque/0/2023/png/34898159/1677040308705-8ee82d85-953f-4f42-81f2-75227261651e.png#averageHue=%23eee6db&clientId=u23331aff-86eb-4&from=paste&height=344&id=u15037f64&name=image.png&originHeight=516&originWidth=712&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=6132&status=done&style=none&taskId=uf926adb4-4ba7-46d3-ae12-83ad6da2e2b&title=&width=474.6666666666667)
## 重心坐标系——靠近边缘的判定方法
在光栅化算法实现中，传入片段着色器中的顶点数据，是基于图元装配的类型，经由光栅化的线性插值计算得出。  
重心坐标系作为一种权重表达，为插值计算提供简单便利的实现，以得出三角形内任一点的顶点数据，也是该方案实现的核心。  
在重心坐标系中的任意点P可用以下公式表示：
![image.png](https://cdn.nlark.com/yuque/0/2023/png/34898159/1677158237228-4786e5e0-c246-4610-af33-ac0190348995.png#averageHue=%23faf9f8&clientId=u1ec16aa9-7fc7-4&from=paste&height=41&id=ue87ef609&name=image.png&originHeight=61&originWidth=469&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=6440&status=done&style=none&taskId=u92fc146a-fb80-4734-b64c-effbd4684f6&title=&width=312.6666666666667)
其中V0、V1、V2为顶点数据，$\lambda_0$、 $\lambda_1$、$\lambda_2$为权重，P为三角形内任意点。  
在这里我们设置三个顶点数据为V0=vec3(1,0,0)，V1=vec3(0,1,0)，V2=vec3(0,0,1)，并将其可视化会得到如下结果。
![](https://cdn.nlark.com/yuque/0/2023/png/34898159/1677035484106-4652d128-ad6a-4145-8f66-9b8e6cf7d81e.png#averageHue=%23f1edea&clientId=u23331aff-86eb-4&from=paste&id=u6e6ffc6c&originHeight=245&originWidth=300&originalType=url&ratio=1.5&rotation=0&showTitle=false&status=done&style=none&taskId=u20c338a3-be54-478c-bb87-8a25b4b93fe&title=)
在极限状态下，例如P位于V0处，此时权重系数$\lambda_0$为1，$\lambda_1$和$\lambda_2$为0，其他顶点同理。  
换一种理解方式，权重系数表达了顶点对应的三角形面积占整个三角形的面积比例。
![image.png](https://cdn.nlark.com/yuque/0/2023/png/34898159/1677157726790-6401ebdd-1e06-41ad-9da5-8b1296eed6e7.png#averageHue=%23fefafa&clientId=u85a016a3-f706-4&from=paste&height=183&id=u175d49c6&name=image.png&originHeight=275&originWidth=411&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=31773&status=done&style=none&taskId=ub67ff025-50d8-4075-a9bd-5260bb193fd&title=&width=274)
![](https://cdn.nlark.com/yuque/0/2023/png/34898159/1677039603030-7c67f04b-79cd-44bf-ab10-d48fdb133d8b.png#averageHue=%234d4d4c&clientId=u23331aff-86eb-4&from=paste&id=u18e25b86&originHeight=245&originWidth=300&originalType=url&ratio=1.5&rotation=0&showTitle=false&status=done&style=none&taskId=u48f1c376-b1a7-49e8-981d-144452f3ec2&title=)

因此我们得到结论：在重心坐标系中，P的任意一个系数小于阈值，代表其靠近其中一个边。  
基于以上结论，我们写出边框着色shader的初版，基于计算出的alpha，得出边框着色的四方体
```glsl
varying vec3 vBarycentric;

float computeAlpha(vec3 barycentric){
  float ratio = min(min(barycentric.x,barycentric.y),barycentric.z);
  float threshold = 0.01;
  return ratio < threshold ? 1. : 0.;
}
```

![image.png](https://cdn.nlark.com/yuque/0/2023/png/34898159/1677033708563-e5892503-50a6-45d7-b45c-4682a8f10c35.png#averageHue=%23eeedeb&clientId=u23331aff-86eb-4&from=paste&height=331&id=ucfa95adc&name=image.png&originHeight=497&originWidth=576&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=20340&status=done&style=none&taskId=u67007020-eec2-4531-9460-4486ea24c6c&title=&width=384)
## dfx,dfy,fwidth——抗锯齿
在上面的例子中，我们通过重心坐标系画出边缘，但是出现了锯齿，这在程序纹理实现当中是普遍存在的现象。解决的方案，是不要基于单个点计算函数的值，需要结合周边点做均值以缓解失真。
![image.png](https://cdn.nlark.com/yuque/0/2023/png/34898159/1677043120668-fb5a4800-3a84-4254-a8bf-21d96bb2cd3e.png#averageHue=%238e8e8e&clientId=u23331aff-86eb-4&from=paste&height=307&id=uc1c5a670&name=image.png&originHeight=460&originWidth=893&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=207727&status=done&style=none&taskId=u3bfad413-6467-4311-844f-e7f70314122&title=&width=595.3333333333334)
dfx和dfy函数，会基于屏幕空间的x和y方向，返回传入参数的近似偏导数。其具体实现方式会有所区别，但通常片段着色器会以2x2（称为四边形片段）进行光栅化，以支持偏导数的计算。  
fwidth函数则会基于传入参数返回x和y方向的近似偏导数之和。  
以传入参数为vec3为例
```glsl
vec3 fwidth(vec3 a)
{
  return abs(dfx(a)) + abs(dfy(a));
}
```
换句话说，fwidth综合考虑了周围的数据，降低高频变化的影响。在我们的例子中，通过fwidth(barycentric)降低了权重系数的突变。  
通过smoothstep（参考备注）函数，我们对barycentric做平滑处理，重新生成权重系数。
```glsl
varying vec3 vBarycentric;

float computeAlpha(vec3 barycentric){
  vec3 d=fwidth(barycentric);
  vec3 a3=smoothstep(vec3(0.),d,barycentric);
  return mix(1.,0.,min(min(a3.x,a3.y),a3.z));
}
```
最后，我们用d乘上线宽参数lineWidth，调节a3的变化速率，以达到减少/增加线宽的目的。
```glsl
varying vec3 vBarycentric;
const float lineWidth = 1.;

float computeAlpha(vec3 barycentric){
  vec3 d=fwidth(barycentric);
  vec3 a3=smoothstep(vec3(0.),d*lineWidth,barycentric);
  return mix(1.,0.,min(min(a3.x,a3.y),a3.z));
}
```
## 缺陷——无法共享顶点数据
虽然该方案可以实现边框着色，但需要预先设置三角形各顶点的权重，因此对重心坐标的顶点数据生成有一定要求，在共享数据的绘制方法中（gl.drawElement）存在问题，在现阶段暂无解决方案。  
如果基于几何着色器，可以结合图元装配所涉及的三个顶点计算距离来实现，无需借助重心坐标系，该方案会在下一篇文档进行讲解。（webgl无几何着色器）
![](https://i.stack.imgur.com/ganU3.png#from=url&id=izlV2&originHeight=279&originWidth=511&originalType=binary&ratio=1.5&rotation=0&showTitle=false&status=done&style=none&title=)
## 备注——关于soomthstep函数
smoothstep函数可以返回0到1的平滑插值，该函数接收三个参数，分别为下限a、上限b和对比参考值x。  
当x<a，返回0。  
当x>b，返回1。  
当a<x<b，基于x返回介于a和b之间的线性插值。
![image.png](https://cdn.nlark.com/yuque/0/2023/png/34898159/1677048001574-735b18c7-34cc-4568-be0a-57fc1354b9ae.png#averageHue=%23fdfdfd&clientId=u23331aff-86eb-4&from=paste&height=309&id=NnQGW&name=image.png&originHeight=463&originWidth=1198&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=12713&status=done&style=none&taskId=u286371b1-4571-4fbe-8822-a4ff8aecf5d&title=&width=798.6666666666666)
## 参考：
【1】[https://developer.download.nvidia.com/cg/ddx.html](https://developer.download.nvidia.com/cg/ddx.html)  
【2】[https://developer.download.nvidia.com/cg/ddy.html](https://developer.download.nvidia.com/cg/ddy.html)  
【3】[https://developer.download.nvidia.com/cg/fwidth.html](https://developer.download.nvidia.com/cg/fwidth.html)   
【4】[https://developer.nvidia.com/sites/all/modules/custom/gpugems/books/GPUGems/gpugems_ch25.html](https://developer.nvidia.com/sites/all/modules/custom/gpugems/books/GPUGems/gpugems_ch25.html)  
【5】[https://stackoverflow.com/questions/24839857/wireframe-shader-issue-with-barycentric-coordinates-when-using-shared-vertices](https://stackoverflow.com/questions/24839857/wireframe-shader-issue-with-barycentric-coordinates-when-using-shared-vertices)  
【6】[https://www.scratchapixel.com/lessons/3d-basic-rendering/rasterization-practical-implementation/rasterization-stage.html](https://www.scratchapixel.com/lessons/3d-basic-rendering/rasterization-practical-implementation/rasterization-stage.html)  
