同步副作用清单（重新编辑 VNDB ID 时的处理）

1. patch 与人物/角色的关系

- 副作用: 旧的 VNDB ID 对应的角色（patch_char_relation）与人物（patch_person_relation）仍然挂在当前 patch 上。
- 处理: 当检测到 VNDB ID 变更时，先清理当前 patch 的关系表: 删除 patch_person_relation 与 patch_char_relation。角色 / 人物记录本身作为全局数据保留（避免影响其他条目）。

2. 语音关联（角色-人物）

- 副作用: linkVoices 生成的 patch_char_person_relation 是全局性的，不分 patch 维度。如果直接删除，可能影响其他条目。
- 处理: 不在清理阶段删除 voice 关系。后续按需增加去重逻辑（如需要），目前维持全局一致性不动。

3. 封面与截图

- 副作用: 旧 VNDB ID 的封面与截图仍然留在 patch_cover / patch_screenshot 表中。
- 处理: 清理阶段删除当前 patch 下的 patch_cover 与 patch_screenshot，再用新 VNDB ID 重新同步。

4. 发行与公司

- 副作用: 旧 VNDB ID 下的 patch_release 与 patch_company_relation 仍然存在，公司统计 count 未恢复。
- 处理: 清理阶段删除当前 patch 的 patch_release 与 patch_company_relation，并对关联的公司 count 执行 decrement。随后根据新 VNDB ID 重新创建并对公司 count increment。

5. 标签

- 副作用: 旧 VNDB ID 下的 patch_tag_relation 未移除，导致标签统计 count 不准确。
- 处理: 清理阶段删除当前 patch 的 patch_tag_relation，并对相关 patch_tag 的 count 执行 decrement。随后根据新数据重新创建并 increment。

6. 链接

- 副作用: 旧 VNDB / Bangumi 链接保留。
- 处理: 清理阶段删除当前 patch 的 patch_link，再基于新数据重建。

7. 别名

- 副作用: 同步脚本会附带新增来自 VNDB/Bangumi 的别名；重新编辑 VNDB ID 后，旧别名可能仍在。
- 处理: 在 app 接口层，update 逻辑已清空并替换别名为用户输入的别名；同步脚本再基于新数据追加别名（本实现默认仍追加）。如需严格区分“用户别名”和“同步别名”，建议在数据模型中增加 provider 字段。

8. 标题与简介（多语言）

- 副作用: 旧 VNDB ID 同步的日文标题（或简介）可能覆盖新的。
- 处理: 先清理，再依据新 VNDB ID 拉取，写入 `name_ja_jp / introduction_*`
  - 若 VNDB ID 为空: 按需求设置 name_ja_jp = ""
  - Bangumi 仅在有非空值时才更新（避免覆盖 VNDB 的有效数据）。

9. Bangumi Subject ID（bid）

- 副作用: 旧 bid 可能不再匹配新 VNDB ID。
- 处理: 重新根据 VNDB 标题与 patch 名称尝试匹配 Bangumi subject；若找到，将 bid 更新为新的 subject id。

备注:

- 清理逻辑聚焦“当前 patch 的副作用”，不删除全局数据（人物、角色以及其别名、语音关系等），避免影响其他条目
- 严格的垃圾回收，删除无任何关联的孤立人物/角色: cleanup-orphans.ts
