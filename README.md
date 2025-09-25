# 自我优势效应何时出现？——任务相关性的影响

> 毕业论文研究项目 | 关联项目链接：https://github.com/Chuan-Peng-Lab/TopDownSPE

## 研究概述

本研究通过三个实验探讨自我优势效应的出现条件：

| 实验名称 | 实验目的 | 实验设计 | 实验假设 |
| :--- | :--- | :--- | :--- |
| **实验一** | 探究加工优先级对自我优势效应的影响 | 3（任务优先级：自我优先、朋友优先、生人优先）×3（图形：三种独特图形）两因素混合实验设计，任务优先级是被试间变量，图形是被试内变量| **自我优先加工时**：SPE出现。**自我不作为任务目标时**：SPE消失。 |
| **实验二** | 探究任务相关性对自我优势效应的影响 |2（任务相关性：任务相关、任务无关）×3（图形：自我图形、朋友图形、生人图形）×2（匹配情况：匹配、不匹配）被试内实验设计| **自我与任务相关时**：SPE出现。 **自我与任务无关时**：SPE可能出现。 |
| **实验三** | 探究认知负载在任务相关性影响自我优势效应中的调节作用 |2（认知负载：低认知负载、高认知负载）×2（任务相关性：任务相关、任务无关）×2（图形：自我图形、生人图形）×2（匹配情况：匹配、不匹配）被试内实验设计 | **自我与任务相关时**：无论高或低认知负载，SPE均出现。**自我与任务无关时**：仅在高认知负载下出现SPE。 |

## 停止数据收集标准

研究使用贝叶斯因子序列分析方法决定停止收集数据的时间，确定停止收集数据的BF阈值为10或1/10，当BF<sub>10</sub>大于10或BF<sub>10</sub>小于1/10时，停止收集数据(胡传鹏等, 2018)，三个实验停止数据收集的关键test为：

- **实验1**：以反应时为因变量，贝叶斯重复测量方差分析中，任务优先级与图形的二阶交互效应BF<sub>10</sub>
- **实验2**：以反应时为因变量，贝叶斯重复测量方差分析中，任务相关性、图形、匹配情况的三阶交互效应BF<sub>10</sub>
- **实验3**：以反应时为因变量，贝叶斯重复测量方差分析中，认知负载、任务相关性、图形、匹配情况的四阶交互效应BF<sub>10</sub>

## 数据分析脚本

**实验1**
- `Preprocessing.R`：数据预处理脚本，在`Data_Analysis.Rmd`中调用
- `Data_Analysis.Rmd`：数据分析脚本
- `pilot_single_subject_analysis.Rmd`：预实验，单个被试数据分析脚本
- `Sequential_Bayes_Factor_Analysis.Rmd`：贝叶斯因子序列分析，停止数据收集脚本

**实验2**
- `Data_Analysis.Rmd`：数据清洗与数据分析脚本
- `Pilot_Single_Subject_Analysis.Rmd`：预实验，单个被试数据分析脚本
- `Sequential_Bayes_Factor_Analysis.Rmd`：贝叶斯因子序列分析，停止数据收集脚本

**实验3**
- 待完善


## 文件夹结构
```
.
├─1_Study1_Task_Target  # 实验1相关文件     
│  ├─1_1_Study_Specific_protocol  # 实验设计文档
│  ├─1_2_MaterialProc  # 实验程序与主试操作手册
│  │  ├─1_2_1_Procedure  # 实验程序
│  │  │  ├─1_2_1_1_Test  # 测试demo
│  │  │  ├─1_2_1_2_Pilot  # 预实验程序
│  │  │  ├─1_2_1_3_Main_self  # 正式实验程序：被试间-自我优先条件
│  │  │  ├─1_2_1_4_Main_friend  # 正式实验程序：被试间-朋友优先条件
│  │  │  ├─1_2_1_5_Main_stranger  # 正式实验程序：被试间-生人优先条件
│  │  │  ├─main_img  # 实验材料
│  │  │  └─test_img  # 预实验材料
│  │  └─1_2_2_Exp1_materials_for_experimenters  # 主试操作手册
│  ├─1_3_RawData  # 原始数据exp1_01~90.csv
│  └─1_4_Analysis  # 数据分析脚本、清洗后数据、分析结果
│      ├─figures
│      ├─glmmModels
│      └─JASP
├─2_Study2_Task_Relevence  # 实验2相关文件
│  ├─2_1_Study_Specific_protocol  # 实验设计文档
│  ├─2_2_MaterialProc  # 实验程序与主试操作手册
│  │  ├─2_2_1_Procedure  # 实验程序
│  │  │  ├─2_2_1_1_Test  # 测试demo
│  │  │  ├─2_2_1_2_Main  # 正式实验程序
│  │  │  └─img  # 实验材料
│  │  └─2_2_2_Exp2_materials_for_experimenters  # 主试操作手册
│  ├─2_3_RawData  # 原始数据
│  └─2_4_Analysis  # 数据分析脚本、清洗后数据、分析结果
│      ├─glmmModels
│      └─Jasp
├─3_Study3_Cognitive_Load  # 实验3相关文件
│  ├─3_1_Study_Specific_protocol  # 实验设计文档
│  ├─3_2_MaterialProc  # 实验程序与主试操作手册
│  │  ├─3_2_1_Procedure  # 实验程序
│  │  │  ├─3_2_1_1_Test  # 测试demo
│  │  │  ├─3_2_1_2_Main  # 正式实验程序
│  │  │  └─img  # 实验材料
│  │  └─3_2_2_Exp3_materials_for_experimenters  # 主试操作手册
│  ├─3_3_RawData  # 原始数据
│  └─3_4_Analysis  # 数据分析脚本、清洗后数据、分析结果
│      └─glmmModels
├─4_Report  # 报告
├─jspsych-7.3.1  
├─jspsych-psychophysics-3.4.0
└─README.md
```

