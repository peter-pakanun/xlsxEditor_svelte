<script>
  import { onMount } from "svelte";
  import { io } from "socket.io-client";

  let socket;
  onMount(() => {
    socket = io();
    socket.on("connect", () => {
      console.log("Socket.IO Connected");
    });
  });
</script>