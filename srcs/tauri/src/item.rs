use serde::{Deserialize, Serialize};

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct Item {
  pub id: i64,
  pub x: i64,
  pub y: i64,
  pub w: i64,
  pub h: i64,
  pub schema: Option<String>,
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct Asset {
  pub id: String,
  pub name: String,
  pub mime: String,
  pub data: Option<Vec<u8>>,
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
struct BaseComponent {
  name: String,
  mime: String,
  content: String,
  styles: Option<String>,
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct Div {
  #[serde(flatten)]
  base: BaseComponent,
  descendants: Option<Vec<Components>>,
  variant: Option<String>,
}
#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct Input {
  #[serde(flatten)]
  base: BaseComponent,
  descendants: Option<Figure>,
  variant: Option<InputVariant>,
}
#[derive(Serialize, PartialEq, Deserialize, Clone, Copy, Debug)]
enum InputVariant {
  SingleLine,
  MultiLine,
  Time,
  DateTime,
  Date,
  Radio,
  Check,
  Number,
  File,
  Color,
}
#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct Figure {
  #[serde(flatten)]
  base: BaseComponent,
  variant: Option<FigureVariant>,
}
#[derive(Serialize, PartialEq, Deserialize, Clone, Copy, Debug)]
enum FigureVariant {
  Img,
  Canvas,
}
#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct Break {
  #[serde(flatten)]
  base: BaseComponent,
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
#[serde(rename_all = "lowercase")]
#[serde(tag = "type")]
pub enum Components {
  Div(Div),
  Input(Input),
  Figure(Figure),
  Break(Break),
}

impl Components {
  pub fn process_refs(self, assets: &mut Vec<Asset>) -> (Self, &Vec<Asset>) {
    (
      match self {
        Components::Div(mut div) => {
          if let Some(components) = div.descendants {
            div.descendants = Some(
              components
                .iter()
                .map(|descendant| descendant.clone().process_refs(assets).0)
                .collect::<Vec<Components>>(),
            );
          }
          Components::Div(div)
        }
        Components::Input(mut input) => {
          if let Some(ref mut figure) = input.descendants {
            if let Ok(content) = figure.base.content.parse::<usize>() {
              if assets.len() < content {
                panic!("Exceeded asset count");
              }
              assets[content].name = figure.clone().base.name;
              assets[content].mime = figure.clone().base.mime;
              figure.base.content = assets[content].clone().id;
              input.descendants = Some(figure.clone())
            }
          }
          Components::Input(input)
        }
        Components::Figure(mut figure) => {
          if let Ok(content) = figure.base.content.parse::<usize>() {
            if assets.len() < content {
              panic!("Exceeded asset count");
            }
            assets[content].name = figure.clone().base.name;
            assets[content].mime = figure.clone().base.mime;
            figure.base.content = assets[content].clone().id;
          }
          Components::Figure(figure.clone())
        }
        other => other,
      },
      assets,
    )
  }
}

#[cfg(test)]
mod tests {
  use uuid::Uuid;

  use super::*;

  #[test]
  fn test() {
    let schema = r#"
    {
      "type": "div",
      "name": "test",
      "mime": "text/plain",
      "content": "test",
      "styles": "{ display: none; }",
      "descendants": [
        {
          "type": "div",
          "name": "test",
          "mime": "text/plain",
          "content": "test",
          "styles": "{ display: none; }",
          "descendants": [
            {
              "type": "input",
              "name": "test",
              "mime": "text/plain",
              "content": "",
              "styles": "{ display: none; }",
              "descendants": {
                "type": "figure",
                "name": "test",
                "mime": "image/png",
                "content": "3",
                "styles": "{ display: none; }"
              }
            }
          ]
        },
        {
          "type": "div",
          "name": "test",
          "mime": "text/plain",
          "content": "test",
          "styles": "{ display: none; }",
          "descendants": [
            {
              "type": "figure",
              "name": "test",
              "mime": "image/png",
              "content": "1",
              "styles": "{ display: none; }"
            },
            {
              "type": "figure",
              "name": "test",
              "mime": "image/png",
              "content": "2",
              "styles": "{ display: none; }"
            }
          ]
        },
        {
          "type": "figure",
          "name": "test",
          "mime": "image/png",
          "content": "0",
          "styles": "{ display: none; }"
        }
      ]
    }
    "#;
    let item_schema = serde_json::from_str::<Components>(&schema).unwrap();
    let mut assets = vec![None, None, None, None]
      .iter_mut()
      .map(|asset| Asset {
        id: Uuid::new_v4().to_string(),
        name: String::from("image"),
        mime: "".to_string(),
        data: asset.take(),
      })
      .collect::<Vec<Asset>>();
    let (output_schema, prepared_assets) = item_schema.process_refs(&mut assets);

    assert_eq!(prepared_assets.len(), 4);
    for asset in prepared_assets.iter() {
      assert!(Uuid::parse_str(&asset.id).is_ok());
      assert_eq!(asset.name, String::from("test"));
      assert_eq!(asset.mime, String::from("image/png"));
      assert_eq!(asset.data, None);
    }
    println!("{prepared_assets:#?}");
    let expected_schema = serde_json::from_str::<Components>(
      format!(
        r#"
    {{
      "type": "div",
      "name": "test",
      "mime": "text/plain",
      "content": "test",
      "styles": "{{ display: none; }}",
      "descendants": [
        {{
          "type": "div",
          "name": "test",
          "mime": "text/plain",
          "content": "test",
          "styles": "{{ display: none; }}",
          "descendants": [
            {{
              "type": "input",
              "name": "test",
              "mime": "text/plain",
              "content": "",
              "styles": "{{ display: none; }}",
              "descendants": {{
                "type": "figure",
                "name": "test",
                "mime": "image/png",
                "content": "{}",
                "styles": "{{ display: none; }}"
              }}
            }}
          ]
        }},
        {{
          "type": "div",
          "name": "test",
          "mime": "text/plain",
          "content": "test",
          "styles": "{{ display: none; }}",
          "descendants": [
            {{
              "type": "figure",
              "name": "test",
              "mime": "image/png",
              "content": "{}",
              "styles": "{{ display: none; }}"
            }},
            {{
              "type": "figure",
              "name": "test",
              "mime": "image/png",
              "content": "{}",
              "styles": "{{ display: none; }}"
            }}
          ]
        }},
        {{
          "type": "figure",
          "name": "test",
          "mime": "image/png",
          "content": "{}",
          "styles": "{{ display: none; }}"
        }}
      ]
    }}
    "#,
        prepared_assets.get(3).unwrap().id,
        prepared_assets.get(1).unwrap().id,
        prepared_assets.get(2).unwrap().id,
        prepared_assets.get(0).unwrap().id,
      )
      .as_str(),
    )
    .unwrap();

    assert_eq!(
      output_schema, expected_schema,
      "Values are not equal: output_schema = {:#?}, expected_schema = {:#?}",
      output_schema, expected_schema
    )
  }
}
