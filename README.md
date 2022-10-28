## Agro-Club/github-actions

### commit-messages-parser

Основная задача - поиск тикетов в сообщениях коммитов между двумя коммитами. Из-за ограничений гитхаба может об

#### Использование:

```yml
on: [push]

jobs:
  example_job:
    runs-on: ubuntu-latest
    name: Example
    steps:
      - name: Find issues in commit messages
        id: find-issues #важно, используется потом для получения output
        uses: Agro-Club/github-actions/commit-messages-parser@master
        with:
          head: ${{ github.event.after }} #хэш коммита, который был замерджен
          base: ${{ github.event.before }} #хэш предыдущего коммита в бранче
```

Результат работы в данном случае будет в `steps.find-issues.outputs.entries`

Аргументы:

```yml
# Токен доступа github
token:
  description: "Github token"
  default: ${{ github.token }}
# Так как экшены не могут выдавать массивы, результат работы будет приведен к
# строке с помощью join, поэтому есть возможность настроить разделитель
delimiter:
  description: "Delimiter for array of entries"
  default: ", "
# Регулярное выражение по которому ищем нужную подстроку, базовая регулярка
# ищет стандартные тикеты Jira по типу "ENT-123"
regexp:
  description: "Regexp to match, defaults to Jira issue regexp"
  default: "[a-zA-Z]+-[0-9]+"
# Название репозитория
repo:
  description: "Repository name"
  default: ${{ github.event.repository.name }}
# Владелец репозитория
owner:
  description: "Repository owner"
  default: ${{ github.event.repository.owner.login }}
head:
  description: "Head commit"
  required: true
base:
  description: "Base commit"
  required: true
```

### jira-multiple-issue-transition

Переводит несколько тикетов Jira к указанному статусу. Можно использовать как вместе с предыдущем экшеном, так и без него.

#### Использование:

```yml
on: [push]

jobs:
  example:
    runs-on: ubuntu-latest
    name: A job to transfer issues
    steps:
      - name: Find issues in commit messages
        id: find-issues
        uses: Agro-Club/github-actions/commit-messages-parser@master
        with:
          head: ${{ github.event.after }}
          base: ${{ github.event.before }}
      - name: Transfer issues
        uses: Agro-Club/github-actions/actions/jira-multiple-issue-transition@master
        with:
          issues: ${{ steps.find-issues.outputs.issues }}
          jira-token: ${{ secrets.JIRA_TOKEN }}
          jira-username: ${{ secrets.JIRA_EMAIL }}
          jira-url: https://agroclub.atlassian.net
          jira-transition-name: "Done"
```

#### Аргументы:

```yml
# Строка с кодами тикетов. Должны быть разделены как указано в issues-delimiter
issues:
  description: "Issues to transfer"
# Разделитель, который для разделения тикетов
delimiter:
  description: "Issues delimiter in the issues string"
  default: ","
# Url вашей компании в Jira, обязателен
jira-url:
  description: "Jira URL"
  required: true
# Email пользователя Jira, обязателен
jira-username:
  description: "Jira username"
  required: true
# Токен пользователя Jira, обязателен
jira-token:
  description: "Jira token"
  required: true
# Название статуса, в который переводим
jira-transition-name:
  description: "Jira transition name"
# Если указано название статуса, то id передавать не нужно. И наоборот - если
# есть id, то название указывать не нужно
jira-transition-id:
  description: "Jira transition id"
```

### jira-multiple-issue-update

Обновляет несколько тикетов Jira.

#### Использование:

```yml
on: [push]

jobs:
  example:
    runs-on: ubuntu-latest
    name: A job to transfer issues
    steps:
      - name: Find issues in commit messages
        id: find-issues
        uses: Agro-Club/github-actions/commit-messages-parser@master
        with:
          head: ${{ github.event.after }}
          base: ${{ github.event.before }}
      - name: Transfer issues
        uses: Agro-Club/github-actions/actions/jira-multiple-issue-transition@master
        with:
          issues: ${{ steps.find-issues.outputs.issues }}
          jira-token: ${{ secrets.JIRA_TOKEN }}
          jira-username: ${{ secrets.JIRA_EMAIL }}
          jira-url: https://agroclub.atlassian.net
          jira-transition-name: "Done"
```

#### Аргументы:

```yml
# Строка с кодами тикетов. Должны быть разделены как указано в issues-delimiter
issues:
  description: "Issues to transfer"
# Разделитель, который для разделения тикетов
delimiter:
  description: "Issues delimiter in the issues string"
  default: ","
# Url вашей компании в Jira, обязателен
jira-url:
  description: "Jira URL"
  required: true
# Email пользователя Jira, обязателен
jira-username:
  description: "Jira username"
  required: true
# Токен пользователя Jira, обязателен
jira-token:
  description: "Jira token"
  required: true
# Строка json с полями, которые нужно обновить.
request-body:
  description: "Must be a json string. For example see request example in\nhttps://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-put"
  required: true
```
