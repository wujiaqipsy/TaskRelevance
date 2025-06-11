###################### This script is used for initializing the analysis ######################


## Function of this script:
# 1. choose the feedback language
# 2. load or prepare packages
# 3. define functions for other scripts


###################### 配置环境与R包 ######################

# 配置环境
if (.Platform$OS.type == 'windows') {
        Sys.setlocale(category = 'LC_ALL','en_US.UTF-8')   # 使用UTF-8编码
} 


setwd("C:/1_Postgraduate/TaskRelevance/1_Study1_Task_Target/1_4_Analysis")   # 设置工作目录

set.seed(42)   # 随机种子，确保结果可复现
knitr::opts_chunk$set(cache.extra = knitr::rand_seed)   # 设置缓存，若随机数未变化则不重复运行已运行的代码块


# 配置R包
if (!require(pacman)){
        install.packages("pacman")
        library(pacman)
}

pacman::p_load(
        'tidyverse',   # 数据处理
        'ggplot2'   # 数据可视化
)


###################### 数据准备 ######################

# 数据合并：将所有被试数据合并到一个数据框中
df_raw <- list.files(file.path("../1_3_RawData"), pattern = "exp1_.*\\.csv$") %>%   # 返回指定路径下，符合正则表达式的文件名
        lapply(function(x) read.csv(file.path("../1_3_RawData", x), header = TRUE)) %>%   # 对每个文件名执行构建路径、读取文件、存储为数据框，最终返回一个列表的操作
        lapply(function(df) dplyr::mutate(   # 对每个被试的数据框执行如下操作
                df,
                # 将 JSON 格式的字符串转换为 R 对象
                subj_idx = as.numeric(jsonlite::fromJSON(response[5])$Q0),
                gender = jsonlite::fromJSON(response[6]),
                year = jsonlite::fromJSON(response[7])$Q0,
                education = jsonlite::fromJSON(response[8])$Q0,
                dist = view_dist_mm[9], # 被试与屏幕的距离
                rt = as.numeric(rt),
                success = as.character(success),
                timeout = as.character(timeout),
                correct = as.character(correct),
                correct = gsub("TRUE", "true", correct),   # 将大写的TRUE替换为小写的true
                RightLable = as.character(RightLable)))%>%
        bind_rows()

# write_excel_csv(df_raw, file = file.path(base_path, "exp1_raw.csv"))

###################### 数据清洗 ######################

df <- df_raw %>%   # 选择感兴趣的变量，排除不感兴趣的变量
        # 排除预实验数据，1-30为pilot data; 1-24为pilot version 1，25-30为pilot version 2
        filter(!(subj_idx %in% 1:30))%>%
        # 选择变量
        select(subj_idx, 
               gender,   # 男0女1
               year,
               rt, 
               correct_response, 
               correct,
               key_press, 
               word,    # labels in matching task
               shape,   # shapes in matching task
               condition, # task types
               trial_type,
        )%>%
        # 排除练习试次
        dplyr::filter(
                trial_type == "psychophysics" &
                        condition != "prac_matching_task" &
                        condition != "prac_classify_self" &
                        condition !="prac_classify_friend" &
                        condition !="prac_classify_stranger"
        )%>%
        # 计算需要的变量
        mutate(
                year = as.numeric(year),
                year = 2025-year,
                acc = ifelse(correct == "true",1,0),
        )%>%
        # 剔除无关变量
        select(
                -trial_type,
                -correct
        )
df


###################### 数据描述 ######################

# 正确率低于0.7的被试
df.excld.sub <-  df %>%
        dplyr::group_by(subj_idx) %>%
        dplyr::summarise(N = length(acc),                    # caculate the overall accuracy for each subject
                         N_crrct = sum(acc),
                         ACC = sum(acc)/length(acc)) %>%
        dplyr::filter(ACC < 0.7) %>%                        # exlucde the participants with less than 70% overall accuracy
        dplyr::select(subj_idx)
# df.excld.sub = 1 # 编号60

# 无效试次占比
df.invalid_trial_rate <- df %>%
        dplyr::filter(!(subj_idx %in% df.excld.sub$subj_idx)) %>%   # 选出正确率高于0.7的被试
        dplyr::summarize(rate = length(rt[!(rt >= 200 & rt<=1500 & acc == 1)])/length(rt))   # 排除不正确试次以及正确但rt不在200-1500ms的试次
# 0.096311

# 有效数据框
df.v <- df %>%
        dplyr::filter(!(subj_idx %in% df.excld.sub$subj_idx))   # 排除正确率低于0.7的被试
df.v

# 基于有效被试的人口学信息统计
df.basic <- df.v %>%
        dplyr::select(subj_idx, year, gender) %>%
        dplyr::distinct(subj_idx, .keep_all = TRUE) %>%     # 根据subject去重，保留完整行
        dplyr::summarise(N = length(subj_idx),
                         Nf = length(gender[gender == "1"]),   # 计算女性人数
                         Nm = length(gender[gender == "0"]),   # 计算男性人数
                         Age_mean = round(mean(year,na.rm=TRUE),2),
                         Age_sd = round(sd(year,na.rm=TRUE),2)
        )


###################### 用于ANOVA分析的数据集 ######################

###### 获取每个被试在每个条件下的平均反应时 适用R ######

# shape-label matching task
df.m.rt_m <- df.v %>%
        dplyr::filter(acc == 1) %>%
        dplyr::filter(condition == 'matching_task')%>%
        dplyr::mutate(
                matchness = ifelse(word == shape, "match", "mismatch"))%>%
        dplyr::group_by(subj_idx, gender, year, condition, matchness, shape) %>%
        dplyr::summarise(RT_m = mean(rt),
                         RT_SD = sd(rt),
                         Ntrial = length(rt)) %>%
        dplyr::ungroup()

df.m.acc <- df.v %>%
        dplyr::filter(condition == 'matching_task')%>%
        dplyr::mutate(
                matchness = ifelse(word == shape, "match", "mismatch"))%>%
        dplyr::group_by(subj_idx, gender, year, condition, matchness, shape) %>%
        dplyr::summarise(N = length(acc),      
                         N_crrct = sum(acc),
                         ACC = sum(acc)/length(acc)) %>%
        dplyr::ungroup()

# classification task
df.c.rt_m <- df.v %>%
        dplyr::filter(acc == 1) %>%
        dplyr::filter(condition != 'matching_task')%>%
        dplyr::group_by(subj_idx, gender, year, condition, shape) %>%
        dplyr::summarise(RT_m = mean(rt),
                         RT_SD = sd(rt),
                         Ntrial = length(rt)) %>%
        dplyr::ungroup()

df.c.acc <- df.v %>%
        dplyr::filter(condition != 'matching_task')%>%
        dplyr::group_by(subj_idx, gender, year, condition, shape) %>%
        dplyr::summarise(N = length(acc),                   
                         N_crrct = sum(acc),
                         ACC = sum(acc)/length(acc)) %>%
        dplyr::ungroup()


###### 获取每个被试在每个条件下的平均反应时 适用JASP ######

# shape-label matching task
df.m.rt.jasp <- df.m.rt_m %>%   
        select(-condition,
               -RT_SD,
               -Ntrial
        ) %>%
        pivot_wider(names_from = c("shape", "matchness"), values_from = "RT_m")

df.m.acc.jasp <- df.m.acc %>%
        select(-condition,
               -N,
               -N_crrct
        ) %>%
        pivot_wider(names_from = c("shape", "matchness"), values_from = "ACC")

# classification task
df.c.rt.jasp <- df.c.rt_m %>%
        select( -RT_SD,
                -Ntrial
        ) %>%
        pivot_wider(names_from = c("shape"), values_from = "RT_m")

df.m.acc.jasp <- df.c.acc %>%
        select( -N,
                -N_crrct
        ) %>%
        pivot_wider(names_from = c("shape"), values_from = "ACC")

# 保存至本地
base_path <- "C:/1_Postgraduate/TaskRelevance/1_Study1_Task_Target/1_4_Analysis"
write_excel_csv(df.c.rt.jasp, file = file.path(base_path, "exp1_classify_rt_jasp.csv"))
write_excel_csv(df.m.acc.jasp, file = file.path(base_path, "exp1_classify_acc_jasp.csv"))


###### 获取每个被试在每个条件下的平均反应时 适用JASP 配对样本t检验 ######

unique_conditions <- unique(df.c.acc$condition)   # 获取 condition 列的所有唯一值

# ACC数据
# for (cond in unique_conditions) {
#         filtered_data <- df.c.acc %>% filter(condition == cond)
#         file_name <- paste0("exp1_", cond, "_acc", ".csv")   # 构造文件名
#         write_excel_csv(filtered_data, file_name)   # 将筛选后的数据保存为 CSV 文件
# }

# RT数据
for (cond in unique_conditions) {
        filtered_data <- df.c.rt.jasp %>% filter(condition == cond)
        file_name <- paste0("exp1_", "rt_", cond, ".csv")
        write_excel_csv(filtered_data, file = file.path(base_path, file_name))
}

###################### 用于贝叶斯层级模型的数据 trial level ######################

# shape-label matching task
df.m <- df.v %>%
        dplyr::filter(!is.na(key_press)) %>%
        dplyr::filter(rt >= 200 & rt<=1500)%>%
        dplyr::filter(condition == 'matching_task')%>%
        dplyr::mutate(
                matchness = ifelse(word == shape, "match", "mismatch"),
                ismatch = ifelse(matchness == 'match', 1, 0),
                saymatch = ifelse((matchness == 'match' & acc == 1) |
                                          (matchness == 'mismatch' & acc == 0), 1, 0),
                shape = factor(shape, levels = c("自我", "朋友", "生人")),
        )%>%
        select(subj_idx, gender, year, shape, matchness, key_press, acc, rt, ismatch, saymatch)
df.m

# classification task
df.c <- df.v %>%
        dplyr::filter(!is.na(key_press)) %>%
        dplyr::filter(rt >= 200 & rt<=1500)%>%
        dplyr::filter(condition != 'matching_task')%>%
        dplyr::mutate(
                shape = factor(shape, levels = c("自我", "朋友", "生人")),
                condition = factor(condition, levels = c("classify_self", "classify_friend", "classify_stranger")),
        )%>%
        select(subj_idx, gender, year, condition, shape, key_press, acc, rt)
df.c


