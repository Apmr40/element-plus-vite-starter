<script lang="ts" setup>
import { ref } from 'vue'
import MyCustomCard from '~/components/MyCustomCard.vue'

const value = ref(new Date())
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header />
      <el-container>
        <el-main>
          <el-row :gutter="20">
            <el-col :span="16">
              <div class="grid-content ep-bg-purple" />
              <el-row :gutter="20">
                <el-col :span="8">
                  <MyCustomCard header="卡片 1" description="这是卡片 1 的描述">
                    卡片 1 的主要内容
                  </MyCustomCard>
                </el-col>
                <el-col :span="8">
                  <MyCustomCard header="卡片 2">
                    卡片 2 的主要内容
                  </MyCustomCard>
                </el-col>
                <el-col :span="8">
                  <MyCustomCard header="卡片 3" description="这是第三张卡片">
                    <h3>一些额外的文本</h3>
                  </MyCustomCard>
                </el-col>
                <el-col :span="8">
                  <MyCustomCard header="卡片 4">
                    <el-image style="width: 100%; height: 100px; object-fit: cover;" src="https://via.placeholder.com/150" fit="cover" />
                  </MyCustomCard>
                </el-col>
                <el-col :span="8">
                  <MyCustomCard header="卡片 5" description="第五个卡片">
                    <el-progress :percentage="70" />
                  </MyCustomCard>
                </el-col>
                <el-col :span="8">
                  <MyCustomCard header="卡片 6">
                    <ul>
                      <li>列表项 1</li>
                      <li>列表项 2</li>
                    </ul>
                  </MyCustomCard>
                </el-col>
              </el-row>
            </el-col>
            <el-col :span="8">
              <div class="grid-content ep-bg-purple-light" />
              <el-calendar v-model="value" class="my-custom-calendar" />
            </el-col>
          </el-row>
        </el-main>
      </el-container>
      <el-footer />
    </el-container>
  </div>
</template>

<style scoped>
.my-custom-calendar .el-calendar-day {
  height: 50px !important;
}
</style>
