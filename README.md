# 自我优势效应何时出现？——任务相关性的影响

> 毕业论文研究项目 | 关联项目链接：https://github.com/Chuan-Peng-Lab/TopDownSPE

## 研究概述

本研究通过三个实验探讨自我优势效应的出现条件：

| 实验名称 | 实验目的 | 实验设计 | 实验假设 |
| :--- | :--- | :--- | :--- |
| **实验一** | 探究任务目标对自我优势效应的影响 | 3（任务目标：自我优先、朋友优先、生人优先）×3（身份：自我、朋友、生人）两因素混合实验设计，任务目标是被试间变量，身份是被试内变量| **自我是任务目标时**：SPE出现。**自我不是任务目标时**：SPE消失。 |
| **实验二** | 探究任务相关性对自我优势效应的影响 |2（任务相关性：自我与任务有关、自我与任务无关）×3（身份：自我、朋友、生人）×2（匹配情况：匹配、不匹配）被试内实验设计| **自我与任务相关时**：SPE出现。 **自我与任务无关时**：SPE可能出现。 |
| **实验三** | 探究在不同认知负荷下，任务相关性对自我优势效应的影响 |2（认知负荷：低负荷、高负荷）×2（任务相关性：自我与任务有关、自我与任务无关）×2（身份：自我、朋友、生人）×2（匹配情况：匹配、不匹配）被试内实验设计 | **若自我信息受控制加工**：自我与任务有关时，SPE在高低认知负荷下有差异；在自我与任务无关时，SPE在高低认知负荷下无差异。**若自我信息为自动加工**：无论自我与任务的相关性，高低认知负荷的SPE均无差异。 |

## 停止数据收集标准

研究使用贝叶斯因子序列分析方法决定停止收集数据的时间，确定停止收集数据的BF阈值为10或1/10，当BF<sub>10</sub>大于10或BF<sub>10</sub>小于1/10时，停止收集数据(胡传鹏等, 2018)，三个实验停止数据收集的关键test为：

- **实验1**：以正确试次的反应时作为统计指标，贝叶斯重复测量方差分析中任务目标与身份的交互效应的BF<sub>10</sub>作为停止收集数据的关键效应；
- **实验2**：以正确试次的反应时作为统计指标，对自我与目标相关任务以及自我与目标无关任务分别统计建模，将贝叶斯层级模型中身份与匹配情况的交互效应BF<sub>10</sub>作为停止收集数据的关键效应；
- **实验3**：以正确试次的反应时作为统计指标，筛选匹配试次数据，对自我与任务相关条件、自我与任务无关条件分别统计建模，将贝叶斯层级模型中认知负荷与身份的交互效应BF<sub>10</sub>值作为停止收集数据的关键效应

## 数据分析脚本

**实验1**
- `Exp1_Data_Analysis.Rmd`：数据分析脚本
- `pilot_single_subject_analysis.Rmd`：预实验，单个被试数据分析脚本
- `Sequential_Bayes_Factor_Analysis.Rmd`：贝叶斯因子序列分析，停止数据收集脚本

**实验2**
- `Exp2_Data_Analysis.Rmd`：数据清洗与数据分析脚本
- `Sequential_Bayes_Factor_Analysis.Rmd`：贝叶斯因子序列分析，停止数据收集脚本

**实验3**
- `Exp3_Data_Analysis.Rmd`：数据清洗与数据分析脚本

## 文件夹结构
```
.
├─1_Study1_Task_Target   # 实验1相关文件     
│  ├─1_1_Study_Specific_protocol   # 实验1 实验设计文档
│  ├─1_2_MaterialProc
│  │  ├─1_2_1_Procedure   # 实验程序
│  │  │  ├─1_2_1_1_Test   # 测试demo
│  │  │  ├─1_2_1_2_Pilot   # 预实验程序
│  │  │  ├─1_2_1_3_Main_self   # 正式实验程序：被试间-自我优先条件
│  │  │  ├─1_2_1_4_Main_friend   # 正式实验程序：被试间-朋友优先条件
│  │  │  ├─1_2_1_5_Main_stranger   # 正式实验程序：被试间-生人优先条件
│  │  │  ├─main_img   # 正式实验材料
│  │  │  └─test_img   # 预实验材料
│  │  └─1_2_2_Exp1_materials_for_experimenters   # 主试操作手册
│  ├─1_3_RawData   # 原始数据exp1_01~90.csv
│  └─1_4_Analysis
│      ├─figures   # 数据结果图
│      ├─glmmModels   # 贝叶斯层级模型结果
│      ├─JASP   # JASP分析
│      ├─Exp1_Data_Analysis.Rmd   # 数据分析脚本
│      ├─pilot_single_subject_analysis.Rmd   # 单被试数据分析脚本
│      └─Sequential_Bayes_Factor_Analysis.Rmd   # 贝叶斯因子计算脚本
├─2_Study2_Task_Relevence  # 实验2相关文件
│  ├─2_1_Study_Specific_protocol   # 实验2 实验设计文档
│  ├─2_2_MaterialProc
│  │  ├─2_2_1_Procedure   # 实验2程序
│  │  │  ├─2_2_1_1_Test   # 测试demo
│  │  │  ├─2_2_1_2_Main   # 正式实验程序
│  │  │  └─img   # 实验材料
│  │  └─2_2_2_Exp2_materials_for_experimenters   # 主试操作手册
│  ├─2_3_RawData  # 原始数据
│  └─2_4_Analysis
│      ├─glmmModels   # 贝叶斯层级模型结果
│      ├─Jasp   # JASP分析
│      ├─Exp2_Data_Analysis.Rmd   # 数据分析脚本
│      └─Sequential_Bayes_Factor_Analysis.Rmd   # 贝叶斯因子计算脚本
├─3_Study3_Cognitive_Load  # 实验3相关文件
│  ├─3_1_Study_Specific_protocol  # 实验3 实验设计文档
│  ├─3_2_MaterialProc
│  │  ├─3_2_1_Procedure  # 实验3程序
│  │  │  ├─3_2_1_1_Test  # 测试demo
│  │  │  ├─3_2_1_2_Main  # 正式实验程序
│  │  │  └─img  # 实验材料
│  │  └─3_2_2_Exp3_materials_for_experimenters  # 主试操作手册
│  ├─3_3_RawData  # 原始数据
│  └─3_4_Analysis  # 数据分析脚本、清洗后数据、分析结果
│      ├─glmmModels   # 贝叶斯层级模型结果
│      └─Exp3_Data_Analysis.Rmd   # 数据分析脚本
├─4_Report
│  ├─4_1_PreReg_Report  # 预注册报告
│  ├─2025_SpringSummary_wjq.pptx   # 2025春季学期总结
│  └─2025_AutumnSummary_wjq.pptx   # 2025秋季学期总结
├─jspsych-7.3.1  
├─jspsych-psychophysics-3.4.0
└─README.md
```

## TO DO LIST
- 实验3数据分析
- 论文初稿撰写
