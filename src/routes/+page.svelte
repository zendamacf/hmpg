<script lang="ts">
  import type { PageProps } from './$types';

  const { data }: PageProps = $props();

  const timeParts = (d: Date) => {
    let hours = d.getHours();
    const minutes = `0${d.getMinutes()}`.slice(-2);
    const seconds = `0${d.getSeconds()}`.slice(-2);
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return { hours, minutes, seconds, ampm };
  };

  let time = $state(timeParts(new Date()));
  const updateTime = () => {
    time = timeParts(new Date());
  };

  setInterval(updateTime, 1000);
</script>

<div class="absolute background" style="--image-url: url({data.url})"></div>
<div class="absolute foreground">
  <section class="top">
    <button
      class="refresh color-in"
      aria-label="Refresh image"
      onclick={async () => {
        // Start icon spinning
        document.querySelector('.refresh i')?.classList.add('fa-spin');
        await fetch('/refresh');
        window.location.reload();
      }}
    >
      <i class="fas fa-sync-alt"></i>
    </button>
  </section>

  <section class="middle">
    <div class="time">
      <span>{time.hours}:{time.minutes}:{time.seconds}</span><small class="time-ampm"
        >{time.ampm}</small
      >
    </div>
  </section>

  <section class="bottom-left">
    <button
      class="location highlight"
      onclick={() =>
        window.open(`http://maps.google.com/?q=${data.latitude},${data.longitude}`, '_blank')}
    >
      <i class="fas fa-map-marker-alt"></i>
      &nbsp;
      <span class="name">{data.location}</span>
    </button>

    <button class="author highlight" onclick={() => window.open(data.url ?? '', '_blank')}>
      <i class="fas fa-camera"></i>
      &nbsp;
      <span class="name">Taken by {data.author_name} on Unsplash</span>
    </button>
  </section>

  <section class="bottom-right">
    <button
      class="credit color-in"
      onclick={() => window.open('https://github.com/zendamacf/hmpg', '_blank')}
      aria-label="GitHub icon"
    >
      <span class="credit-icon">
        <i class="fab fa-github"></i>
      </span>
    </button>
  </section>
</div>

<style>
  :global(body) {
    font-family: 'Lato', sans-serif;
    color: white;
  }
  small {
    font-size: 35%;
  }
  i {
    text-align: center;
    font-size: 1.2em;
    width: 20px !important;
  }
  button {
    background: none;
    border: none;
    margin: 0;
    padding: 0;
    cursor: pointer;
    color: white;

    &.color-in {
      transition: ease 0.4s;
      &:hover {
        color: #0b5563;
      }
    }

    &.highlight {
      box-shadow: inset 0 0 0 0 #0b5563;
      padding: 0.25em;
      border-radius: 0.25em;
      transition: box-shadow 0.4s ease-in-out;
      &:hover {
        box-shadow: inset 500px 0 0 0 #0b5563;
      }
    }
  }

  .absolute {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .background {
    height: 100%;
    background-position: center center;
    background-repeat: no-repeat;
    background-size: cover;
    background-color: #464646;
    background-image: var(--image-url);
    z-index: 1;
  }

  .foreground {
    z-index: 2;

    section {
      position: absolute;
    }

    .top {
      top: 0;
      left: 0;
      right: 0;
    }

    .middle {
      display: block;
      width: 100%;
      top: 50%;
      -ms-transform: translateY(-50%);
      transform: translateY(-50%);
      text-align: center;
    }

    .bottom-left {
      bottom: 0;
      left: 0;
    }

    .bottom-right {
      bottom: 0;
      right: 0;
    }

    .refresh {
      max-width: 20px;
      margin-left: 1em;
      margin-top: 1em;
    }

    .time {
      font-size: clamp(2rem, 20vw, 12rem);
      font-weight: bold;

      .time-ampm {
        margin-left: 10px;
      }
    }

    .location {
      display: block;
      margin-left: 1em;

      + .author {
        margin-top: 0.4em;
      }
    }

    .author {
      display: block;
      font-style: italic;
      margin-left: 1em;
      margin-bottom: 1em;
    }

    .credit {
      display: block;
      transition: ease-in-out all 0.4s;
      margin-right: 1em;
      margin-bottom: 1em;
    }
  }
</style>
