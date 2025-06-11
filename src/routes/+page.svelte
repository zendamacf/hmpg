<script lang="ts">
  import type { PageProps } from './$types';

  const { data }: PageProps = $props();

  const timeParts = (d: Date) => {
    let hours = d.getHours();
    const minutes = `0${d.getMinutes()}`.slice(-2);
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return {
      hours: hours,
      minutes: minutes,
      ampm: ampm,
    };
  };

  const time = timeParts(new Date());
</script>

<div class="absolute background" style="--image-url: url({data.url})"></div>
<div class="absolute foreground">
  <section class="top">
    <button
      class="refresh"
      aria-label="Refresh image"
      onclick={async () => {
        await fetch('/refresh');
        window.location.reload();
      }}
    >
      <i class="fas fa-sync-alt"></i>
    </button>
  </section>

  <section class="middle">
    <div class="time">
      <span>{time.hours}:{time.minutes}</span>
      <small class="time-ampm">{time.ampm}</small>
    </div>
  </section>

  <section class="bottom-left">
    <a
      class="location"
      href={`http://maps.google.com/?q=${data.latitude},${data.longitude}`}
      target="_blank"
    >
      <i class="fas fa-map-marker-alt"></i>
      <span class="name">{data.location}</span>
    </a>

    <a class="author" href={data.url} target="_blank">
      <i class="fas fa-camera"></i>
      <span class="name">Taken by {data.author_name} on Unsplash</span>
    </a>
  </section>

  <section class="bottom-right">
    <a class="credit" href="https://github.com/zendamacf/hmpg" target="_blank">
      <span class="credit-label"> By Zach Lang </span>

      <span class="credit-icon">
        <i class="fab fa-github"></i>
      </span>
    </a>
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
    width: 20px !important;
  }
  a {
    text-decoration: none;
    color: white;
  }
  button {
    background: none;
    border: none;
    margin: 0;
    padding: 0;
    cursor: pointer;
    color: white;
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
      font-size: 12em;
      font-weight: bold;

      .time-ampm {
        margin-left: -25px;
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

      .credit-label {
        opacity: 0;
        transition: ease-in-out all 0.4s;
      }

      &:hover .credit-label {
        opacity: 1;
      }
    }
  }
</style>
