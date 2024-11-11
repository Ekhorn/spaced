use serde::{Deserialize, Serialize};

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct Item {
  pub id: i64,
  pub x: i64,
  pub y: i64,
  pub w: i64,
  pub h: i64,
  pub editor: String,
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
pub struct EmptyText {
  pub text: String,
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct CustomText {
  pub text: String,
  pub bold: Option<bool>,
  pub italic: Option<bool>,
  pub code: Option<bool>,
  pub underline: Option<bool>,
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct BlockQuoteElement {
  align: Option<String>,
  children: Vec<Descendant>,
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct BulletedListElement {
  align: Option<String>,
  children: Vec<Descendant>,
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct CheckListItemElement {
  checked: bool,
  children: Vec<Descendant>,
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct HeadingElement {
  align: Option<String>,
  children: Vec<Descendant>,
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct HeadingTwoElement {
  align: Option<String>,
  children: Vec<Descendant>,
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct ImageElement {
  mime: String,
  name: String,
  uuid: String,
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct LinkElement {
  url: String,
  children: Vec<Descendant>,
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct ButtonElement {
  children: Vec<Descendant>,
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct ListItemElement {
  children: Vec<Descendant>,
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct ParagraphElement {
  align: Option<String>,
  children: Vec<Descendant>,
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct CodeBlockElement {
  language: String,
  children: Vec<EmptyText>,
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
pub struct CodeLineElement {
  children: Vec<EmptyText>,
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
#[serde(tag = "type")]
pub enum Element {
  BlockQuote(BlockQuoteElement),
  BulletedList(BulletedListElement),
  CheckListItem(CheckListItemElement),
  Heading(HeadingElement),
  HeadingTwo(HeadingTwoElement),
  Image(ImageElement),
  Link(LinkElement),
  Button(ButtonElement),
  ListItem(ListItemElement),
  Paragraph(ParagraphElement),
  CodeBlock(CodeBlockElement),
  CodeLine(CodeLineElement),
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum Descendant {
  Text(CustomText),
  Element(Element),
}

impl Descendant {
  pub fn process_refs(self, assets: &mut Vec<Asset>) -> (Self, &Vec<Asset>) {
    (
      match self {
        Descendant::Element(element) => match element {
          Element::BlockQuote(mut element) => {
            element.children = element
              .children
              .iter()
              .map(|descendant| descendant.clone().process_refs(assets).0)
              .collect::<Vec<Descendant>>();
            Descendant::Element(Element::BlockQuote(element))
          }
          Element::Button(mut element) => {
            element.children = element
              .children
              .iter()
              .map(|descendant| descendant.clone().process_refs(assets).0)
              .collect::<Vec<Descendant>>();
            Descendant::Element(Element::Button(element))
          }
          Element::Paragraph(mut element) => {
            element.children = element
              .children
              .iter()
              .map(|descendant| descendant.clone().process_refs(assets).0)
              .collect::<Vec<Descendant>>();
            Descendant::Element(Element::Paragraph(element))
          }
          Element::Image(mut image) => {
            if let Ok(content) = image.uuid.parse::<usize>() {
              assert!(assets.len() >= content, "Exceeded asset count");
              assets[content].name = image.clone().name;
              assets[content].mime = image.clone().mime;
              image.uuid = assets[content].clone().id;
            }
            Descendant::Element(Element::Image(image))
          }
          other => Descendant::Element(other),
        },
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
      "type": "paragraph",
      "children": [
        {
          "text": "test"
        },
        {
          "type": "paragraph",
          "children": [
            {
              "text": "test"
            },
            {
              "type": "image",
              "mime": "image/png",
              "name": "image",
              "uuid": "3"
            }
          ]
        },
        {
          "type": "paragraph",
          "children": [
            {
              "text": "test"
            },
            {
              "type": "image",
              "mime": "image/png",
              "name": "image",
              "uuid": "1"
            },
            {
              "type": "image",
              "mime": "image/png",
              "name": "image",
              "uuid": "2"
            }
          ]
        },
        {
          "type": "image",
          "mime": "image/png",
          "name": "image",
          "uuid": "0"
        }
      ]
    }
    "#;
    let item_schema = serde_json::from_str::<Descendant>(&schema).unwrap();
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
      assert_eq!(asset.name, String::from("image"));
      assert_eq!(asset.mime, String::from("image/png"));
      assert_eq!(asset.data, None);
    }
    println!("{prepared_assets:#?}");
    let expected_schema = serde_json::from_str::<Descendant>(
      format!(
        r#"
    {{
      "type": "paragraph",
      "children": [
        {{
          "text": "test"
        }},
        {{
          "type": "paragraph",
          "children": [
            {{
              "text": "test"
            }},
            {{
              "type": "image",
              "mime": "image/png",
              "name": "image",
              "uuid": "{}"
            }}
          ]
        }},
        {{
          "type": "paragraph",
          "children": [
            {{
              "text": "test"
            }},
            {{
              "type": "image",
              "mime": "image/png",
              "name": "image",
              "uuid": "{}"
            }},
            {{
              "type": "image",
              "mime": "image/png",
              "name": "image",
              "uuid": "{}"
            }}
          ]
        }},
        {{
          "type": "image",
          "mime": "image/png",
          "name": "image",
          "uuid": "{}"
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
