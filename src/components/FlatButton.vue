<template lang="pug">
  button.big-flat-button(@click="evt => $emit('click', evt)")
    slot
</template>

<style lang="scss" scoped>
$color: #222222;
$bg-color: #F1F1F1;
$border-color: darken($bg-color, 20%);

$hover-color: $color;
$hover-bg-color: lighten($bg-color, 2%);
$hover-border-color: $border-color;

$active-color: $color;
$active-bg-color: lighten($bg-color, 2%);
// $active-border-color: transparent;

$disabled-color: lighten($color, 30%);
$disabled-bg-color: darken($bg-color, 2%);
// $disabled-border-color: transparent;

.big-flat-button {
  outline: none;
  border-width: 1px;
  border-style: none none solid none;
  border-radius: 5px;
  border-color: $border-color;
  background-color: $bg-color;
  cursor: pointer;
  padding: .25em .5em;
  margin: 0 .2em;
  color: $color;
  font-size: 1em;

  &:hover {
    background-color: $hover-bg-color;
    border-color: $hover-border-color;
    color: $hover-color;
  }

  &:active {
    background-color: $active-bg-color;
    color: $active-color;
    border-style: none;
    margin-top: 1px;
  }


  &[disabled]{
    background-color: $disabled-bg-color;
    color: $disabled-color;
    cursor: not-allowed;
    border-style: none;
    margin-top: 1px;
  }
}
</style>
